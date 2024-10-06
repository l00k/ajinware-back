import { LoggerWrapper } from '$/service/logger/index.js';
import { Config } from '@inti5/configuration';
import { InitializeSymbol, Inject } from '@inti5/object-manager';
import { snakeCase } from 'lodash-es';
import { serializer } from 'serialzr';
import type { DbConfig, Schema } from './def.js';



export class SchemaProvider
{
    
    @Inject(() => LoggerWrapper, [ 'Database:SchemaProvider' ])
    protected _logger : LoggerWrapper;
    
    @Config('db')
    protected _config : DbConfig;
    
    protected _schema : Schema = new Map();
    
    
    
    public [InitializeSymbol] ()
    {
        for (const model of this._config.models()) {
            const friendlyName = snakeCase(serializer.getTypeName(model));
            this._schema.set(model, friendlyName);
        }
    }
    
    public getSchema () : Schema
    {
        return this._schema;
    }
    
}
