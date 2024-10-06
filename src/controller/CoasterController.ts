import { Coaster } from '$/model/Coaster.js';
import { ExposeGroup } from '$/model/ExposeGroup.js';
import * as Requests from '$/model/request/index.js';
import * as Responses from '$/model/response/index.js';
import type { ApiContext } from '$/service/api/index.js';
import { Action, ActionMethod } from '$/service/api/index.js';
import type { Database } from '$/service/db/index.js';
import { LoggerWrapper } from '$/service/logger/index.js';
import type { SyncManager } from '$/service/sync/index.js';
import { Inject } from '@inti5/object-manager';
import { validate } from 'class-validator';
import { cloneDeep, merge } from 'lodash-es';
import { v4 as uuid } from 'uuid';
import { AbstractController } from './AbstractController.js';


export class CoasterController extends AbstractController
{
    
    @Inject(() => LoggerWrapper)
    protected _logger : LoggerWrapper;
    
    @Inject('db')
    protected _db : Database;
    
    @Inject('syncManager')
    protected _syncManager : SyncManager;
    
    
    @Action(
        ActionMethod.GET, 'coasters',
        () => Requests.GetCoasters
    )
    public async actionGetCoasters (
        { body: listParams } : Requests.GetCoasters,
        context : ApiContext
    ) : Promise<Responses.GetCoasters>
    {
        const coasters = this._db.find(
            Coaster,
            listParams?.filters,
            listParams?.order,
            listParams?.pagination
        );
        
        return new Responses.GetCoasters({
            body: coasters
        });
    }
    
    @Action(
        ActionMethod.GET, 'coasters/:coasterId',
        () => Requests.GetCoaster
    )
    public async actionGetCoaster (
        { params: { coasterId } } : Requests.GetCoaster,
        context : ApiContext
    ) : Promise<Responses.GetCoaster>
    {
        const coaster = this._db.getById(Coaster, coasterId);
        if (!coaster) {
            return this._prepareNotFoundResponse('Coaster not found', 1728196562539);
        }
        
        return new Responses.GetCoaster({
            body: coaster
        });
    }
    
    @Action(
        ActionMethod.POST, 'coasters',
        () => Requests.CreateCoasters
    )
    public async actionCreateCoasters (
        { body: coaster } : Requests.CreateCoasters,
        context : ApiContext
    ) : Promise<Responses.GetCoaster>
    {
        // set id
        coaster.id = uuid();
        
        this._persistChanges(coaster);
        
        return new Responses.GetCoaster({
            body: coaster
        });
    }
    
    @Action(
        ActionMethod.PUT, 'coasters/:coasterId',
        () => Requests.UpdateCoaster,
        { keepInitialValues: false }
    )
    @Action.Groups.Request([ ExposeGroup.Update ])
    public async actionUpdateCoaster (
        { body: coasterUpd, params: { coasterId } } : Requests.UpdateCoaster,
        context : ApiContext
    )
    {
        // find coaster
        const coaster = this._db.getById(Coaster, coasterId);
        if (!coaster) {
            return this._prepareNotFoundResponse('Coaster not found', 1728135683166);
        }
        
        // validate now
        {
            // clone coaster and merge
            const clonedCoaster = cloneDeep(coaster);
            merge(clonedCoaster, coasterUpd);
            
            const validationResult = await validate(clonedCoaster);
            if (validationResult.length) {
                return new Responses.ValidationFailed({
                    body: validationResult
                });
            }
        }
        
        // it is valid - merge safely now
        merge(coaster, coasterUpd);
        
        this._persistChanges(coaster);
        
        return new Responses.GetCoaster({
            body: coaster
        });
    }
    
    @Action(
        ActionMethod.POST, 'coasters/:coasterId/wagons',
        () => Requests.CreateWagon
    )
    public async actionCreateWagon (
        { body: wagon, params: { coasterId } } : Requests.CreateWagon,
        context : ApiContext
    )
    {
        // find coaster
        const coaster = this._db.getById(Coaster, coasterId);
        if (!coaster) {
            return this._prepareNotFoundResponse('Coaster not found', 1728128585924);
        }
        
        // set id
        wagon.id = uuid();
        
        // add wagon to coaster
        coaster.wagons.push(wagon);
        
        this._persistChanges(coaster);
        
        return new Responses.GetWagon({
            body: wagon
        });
    }
    
    @Action(
        ActionMethod.DELETE, 'coasters/:coasterId/wagons/:wagonId',
        () => Requests.DeleteWagon
    )
    public async actionDeleteWagon (
        { params: { coasterId, wagonId } } : Requests.DeleteWagon,
        context : ApiContext
    )
    {
        // find coaster
        const coaster = this._db.getById(Coaster, coasterId);
        if (!coaster) {
            return this._prepareNotFoundResponse('Coaster not found', 1728196609984);
        }
        
        // find wagon
        const wagonIdx = coaster.wagons.findIndex(wagon => wagon.id === wagonId);
        if (wagonIdx == -1) {
            return this._prepareNotFoundResponse('Wagon not found', 1728134626069);
        }
        
        // delete wagon
        coaster.wagons.splice(wagonIdx, 1);
        
        this._persistChanges(coaster);
        
        return new Responses.BaseResponse();
    }
    
    
    protected _persistChanges (coaster : Coaster)
    {
        this._db.save(coaster);
        
        this._db.flush()
            .catch(err => {
                this._logger.error('Failed to save coaster', coaster, err);
            });
        
        this._syncManager.publish(coaster)
            .catch(err => {
                this._logger.error('Failed to publish coaster', coaster, err);
            });
    }
    
}
