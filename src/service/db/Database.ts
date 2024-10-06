import { OrderDir } from '$/model/db/index.js';
import type { Filters, Order, Pagination } from '$/model/db/index.js';
import type { AbstractModel } from '$/service/db/AbstractModel.js';
import { SchemaProvider } from '$/service/db/SchemaProvider.js';
import { LoggerWrapper } from '$/service/logger/index.js';
import { accessThroughPath } from '$/utils/accessThroughPath.js';
import { Exception } from '$/utils/Exception.js';
import { Config } from '@inti5/configuration';
import { InitializeSymbol, Inject, ObjectManager } from '@inti5/object-manager';
import protobiQuery from 'query';
import type { ClassConstructor, DbConfig, DbData, DbRecordId, Schema } from './def.js';
import { PersistanceProvider } from './PersistanceProvider.js';


export class Database
{
    
    @Inject(() => LoggerWrapper, [ 'Database' ])
    protected _logger : LoggerWrapper;
    
    @Inject(() => SchemaProvider)
    protected _schemaProvider : SchemaProvider;
    
    protected _persistanceProvider : PersistanceProvider;
    
    @Config('db')
    protected _config : DbConfig;
    
    protected _schema : Schema;
    protected _data : DbData;
    
    protected _dataChanged : Set<string> = new Set();
    
    
    public [InitializeSymbol] ()
    {
        this._persistanceProvider = ObjectManager.getSingleton()
            .getInstance(PersistanceProvider, [ this._schemaProvider ]);
    }
    
    public async init ()
    {
        this._schema = this._schemaProvider.getSchema();
        
        await this._persistanceProvider.init();
        await this.forceLoad();
    }
    
    
    public async forceLoad ()
    {
        // load user data scope
        this._logger.debug('Loading data');
        this._data = await this._persistanceProvider.loadAllData();
    }
    
    
    /*
     * Data access methods
     */
    public getById<T extends AbstractModel> (
        model : ClassConstructor<T>,
        recordId : DbRecordId
    ) : T
    {
        const modelName = this._schema.get(model);
        
        const records = this._data[modelName];
        if (!records) {
            throw new Exception(`Unknown model "${modelName}"`, 1727948931276);
        }
        
        return <any>records.find(record => record.id === recordId);
    }
    
    public findOne<T extends AbstractModel> (
        model : ClassConstructor<T>,
        filters : Filters<T>,
        order : Order[] = [],
    ) : T
    {
        const modelName = this._schema.get(model);
        
        const records = this._data[modelName];
        if (!records) {
            throw new Exception(`Unknown model "${modelName}"`, 1728120439093);
        }
        
        let matched : T[] = <any>records ?? [];
        
        if (
            filters
            && Object.keys(filters).length != 0
        ) {
            matched = protobiQuery.query(matched, filters);
        }
        
        if (matched.length == 0) {
            return null;
        }
        
        if (
            order
            && order.length != 0
        ) {
            matched = matched.sort((a, b) => {
                for (const { field, dir } of order) {
                    const valueA = accessThroughPath(a, field);
                    const valueB = accessThroughPath(b, field);
                    
                    if (valueA < valueB) {
                        return dir == OrderDir.ASC ? -1 : 1;
                    }
                    else if (valueA > valueB) {
                        return dir == OrderDir.ASC ? 1 : -1;
                    }
                }
                return 0;
            });
        }
        
        if (matched.length == 0) {
            return null;
        }
        
        return matched[0];
    }
    
    public find<T extends AbstractModel> (
        model : ClassConstructor<T>,
        filters : Filters<T>,
        order : Order[] = [],
        pagination : Pagination = { limit: 10 }
    ) : T[]
    {
        const modelName = this._schema.get(model);
        
        const records = this._data[modelName];
        if (!records) {
            throw new Exception(`Unknown model "${modelName}"`, 1728120447082);
        }
        
        let matched : T[] = <any>records ?? [];
        
        if (
            filters
            && Object.keys(filters).length != 0
        ) {
            matched = protobiQuery.query(matched, filters);
        }
        
        if (matched.length == 0) {
            return [];
        }
        
        if (
            order
            && order.length != 0
        ) {
            matched = matched.sort((a, b) => {
                for (const { field, dir } of order) {
                    const valueA = accessThroughPath(a, field);
                    const valueB = accessThroughPath(b, field);
                    
                    if (valueA < valueB) {
                        return dir == OrderDir.ASC ? -1 : 1;
                    }
                    else if (valueA > valueB) {
                        return dir == OrderDir.ASC ? 1 : -1;
                    }
                }
                return 0;
            });
        }
        
        if (pagination?.offset) {
            matched = matched.slice(pagination.offset);
        }
        
        if (pagination?.limit) {
            matched = matched.slice(0, pagination.limit);
        }
        
        return matched;
    }
    
    
    /*
     * Data manipulation methods
     */
    public save<T extends AbstractModel> (record : T)
    {
        const modelName = this._schema.get(record.constructor);
        
        const records = this._data[modelName];
        if (!records) {
            throw new Exception(`Unknown model "${modelName}"`, 1728121097037);
        }
        
        const recordIdx = records.findIndex(r => r.id === record.id);
        if (recordIdx != -1) {
            records[recordIdx] = record;
        }
        else {
            records.push(record);
        }
        
        this._dataChanged.add(modelName);
    }
    
    public delete<T extends AbstractModel> (record : T) : boolean
    {
        return this.deleteById(
            <any>record.constructor,
            record.id
        );
    }
    
    public deleteById<T extends AbstractModel> (
        model : ClassConstructor<T>,
        id : DbRecordId
    ) : boolean
    {
        const modelName = this._schema.get(model);
        
        const records = this._data[modelName];
        if (!records) {
            throw new Exception(`Unknown model "${modelName}"`, 1728121097037);
        }
        
        const existingRecord = records.find(r => r.id === id);
        if (existingRecord) {
            const recordIdx = records.findIndex(record => record.id === existingRecord.id);
            if (recordIdx != -1) {
                records.splice(recordIdx, 1);
                
                this._dataChanged.add(modelName);
                
                return true;
            }
        }
        
        return false;
    }
    
    
    public flush ()
    {
        return this._persistChanges();
    }
    
    
    /**
     * Persist changes to storage
     */
    protected async _persistChanges ()
    {
        // collect modified tables
        const modifiedData = Object.fromEntries(
            Array.from(this._dataChanged).map(modelName => [ modelName, this._data[modelName] ])
        );
        
        return this._persistanceProvider.persistChanges(modifiedData);
    }
    
}
