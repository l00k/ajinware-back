import { ExposeGroup } from '$/model/ExposeGroup.js';
import { BaseResponse } from '$/model/response/BaseResponse.js';
import { ValidationFailed } from '$/model/response/ValidationFailed.js';
import { LoggerWrapper } from '$/service/logger/index.js';
import { Exception } from '$/utils/Exception.js';
import { Config } from '@inti5/configuration';
import { ReleaseSymbol , Inject, ObjectManager } from '@inti5/object-manager';
import { validate } from 'class-validator';
import express from 'express';
import { globby } from 'globby';
import type * as http from 'http';
import { trim } from 'lodash-es';
import path from 'node:path';
import { serializer } from 'serialzr';
import type { ActionDefinition, ApiConfig, ApiContext } from './def.js';
import { MetadataStorage } from './MetadataStorage.js';


export class ApiService
{
    
    @Inject(() => LoggerWrapper, [ 'Api' ])
    protected _logger : LoggerWrapper;
    
    @Config('srcPath')
    protected _srcPath : string;
    
    @Config('api')
    protected _config : ApiConfig;
    
    protected _app : express.Application;
    protected _server : http.Server;
    
    
    public async [ReleaseSymbol] ()
    {
        await this.stop();
    }
    
    
    public async start ()
    {
        this._app = express();
        
        // add middlewares
        this._app.use(express.json());
        
        // load controllers and bind actions
        await this._loadAllControllers();
        this._bindActions();
        
        // not found handler
        this._app.use((req, res) => {
            res.status(404);
            res.json({
                result: 'Error',
                message: 'Not found',
                code: 1728197295847,
            });
        });
        
        // start server
        this._logger.debug(
            'Starting API service on port',
            this._config.port
        );
        
        this._server = this._app.listen(this._config.port);
    }
    
    public async stop ()
    {
        if (this._server) {
            this._logger.debug('Stopping API service');
            
            this._server.close();
            
            this._app = null;
            this._server = null;
        }
    }
    
    
    protected async _loadAllControllers ()
    {
        const controllersDirPath = path.join(
            this._srcPath,
            'controller'
        );
        
        const controllersPaths = await globby(controllersDirPath, {
            expandDirectories: {
                extensions: [ 'js', 'ts' ]
            }
        });
        for (const controllerPath of controllersPaths) {
            this._logger.debug('Loading controller', controllerPath);
            
            await import(controllerPath);
        }
    }
    
    protected _bindActions ()
    {
        const objectManager = ObjectManager.getSingleton();
        const metadataStorage = MetadataStorage.getSingleton();
        const controllerClasses = metadataStorage.getAllControllers();
        
        for (const controllerClass of controllerClasses) {
            const controller = objectManager.getInstance(controllerClass);
            const actions = metadataStorage.getAllActions(controllerClass);
            
            for (const action of Object.values(actions)) {
                const method = action.method.toLowerCase();
                const routeUrl = '/'
                    + trim(this._config.basePath, '/')
                    + '/'
                    + trim(action.route, '/')
                ;
                
                this._logger.debug(
                    'Binding action',
                    action.method,
                    routeUrl
                );
                
                this._app[method](
                    routeUrl,
                    this._handleRequest.bind(this, controller, action)
                );
            }
        }
    }
    
    protected async _handleRequest (
        controller : any,
        action : ActionDefinition,
        expressReq : express.Request,
        expressResp : express.Response
    )
    {
        this._logger.debug('Request', expressReq.method, expressReq.url);
        
        let response : BaseResponse = new BaseResponse({
            status: 200,
            body: 'OK'
        });
        
        const context : ApiContext = {
            request: expressReq,
            response: expressResp,
        };
        
        // create request object
        const request = serializer.toClass({
            body: expressReq.body,
            params: expressReq.params,
            query: expressReq.query
        }, {
            type: action.requestFn(),
            ...action.options,
            groups: [
                ExposeGroup.Public,
                ExposeGroup.ApiIn,
                ...action.options.groups.request
            ],
        });
        
        // validate request
        const validationResult = await validate(request);
        if (validationResult.length) {
            response = new ValidationFailed({ body: validationResult });
        }
        else {
            // execute
            try {
                response = await controller[action.propertyKey](request, context);
            }
            catch (e : any) {
                this._logger.error(e);
                
                response.status = 500;
                
                if (e instanceof Exception) {
                    response.body = {
                        result: 'Error',
                        message: e.message,
                        code: e.code
                    };
                }
                else {
                    response.body = {
                        result: 'Error',
                        message: 'Internal server error',
                        code: 1728197287447,
                    };
                }
            }
        }
        
        // Send response
        let status : number = response.status;
        let bodyJson = {};
        
        try {
            const plain = serializer.toPlain(response, {
                groups: [
                    ExposeGroup.Public,
                    ExposeGroup.ApiOut,
                    ...action.options.groups.response
                ]
            });
            bodyJson = plain.body;
        }
        catch (e) {
            status = 500;
            bodyJson = { error: 'Error serializing response' };
        }
        
        expressResp.status(status);
        expressResp.json(bodyJson);
        expressResp.end();
    }
    
}
