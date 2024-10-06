import { LoggerWrapper } from '$/service/logger/index.js';
import { Config } from '@inti5/configuration';
import { InitializeSymbol, Inject, ReleaseSymbol } from '@inti5/object-manager';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { serializer } from 'serialzr';
import type { AbstractModel } from './AbstractModel.js';
import type { DbConfig, DbData, DbTable, Schema } from './def.js';
import { ExposeGroup } from '$/model/ExposeGroup.js';
import type { SchemaProvider } from './SchemaProvider.js';


type ToPersist = Record<string, DbTable>


export class PersistanceProvider
{
    
    @Inject(() => LoggerWrapper, [ 'Database:Persistance' ])
    protected _logger : LoggerWrapper;
    
    protected _schemaProvider : SchemaProvider;
    
    @Config('db')
    protected _config : DbConfig;
    
    protected _storagePath : string;
    
    protected _schema : Schema;
    
    protected _toPersist : ToPersist = {};
    protected _persistancePromise : Promise<void>;
    
    
    public constructor (schemaProvider : SchemaProvider)
    {
        this._schemaProvider = schemaProvider;
    }
    
    public [InitializeSymbol] ()
    {
        // prepare storage directory
        this._storagePath = path.resolve(
            this._config.storagePath.replace('@', process.cwd())
        );
        
        if (!fsSync.existsSync(this._storagePath)) {
            fsSync.mkdirSync(this._storagePath, { recursive: true });
        }
    }
    
    public async [ReleaseSymbol] ()
    {
        if (this._persistancePromise) {
            this._logger.debug('Waiting for persistance to finish');
            
            await this._persistancePromise;
        }
    }
    
    
    public async init ()
    {
        this._schema = this._schemaProvider.getSchema();
    }
    
    
    public async loadAllData () : Promise<DbData>
    {
        const data : DbData = {};
        
        for (const modelName of this._schema.values()) {
            const storageExists = await this.modelStorageExists(modelName);
            if (storageExists) {
                const records = await this.loadModelRecords(modelName);
                data[modelName] = records;
            }
            else {
                data[modelName] = [];
            }
        }
        
        return data;
    }
    
    public async modelStorageExists (tableName : string) : Promise<boolean>
    {
        const tablePath = this._getModelStorageFilePath(tableName);
        try {
            await fs.access(tablePath, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    
    protected _getModelStorageFilePath (tableName : string) : string
    {
        const tableFile = tableName + '.json';
        return path.join(this._storagePath, tableFile);
    }
    
    public async loadModelRecords<T extends AbstractModel> (model : string) : Promise<T[]>
    {
        const tableFilePath = this._getModelStorageFilePath(model);
        const contentRaw = await fs.readFile(tableFilePath, { encoding: 'utf8' });
        
        try {
            const modelRecordsRaw = JSON.parse(contentRaw);
            const modelRecords = serializer.toClass(modelRecordsRaw, {
                groups: [ ExposeGroup.Storage ],
            });
            
            return <any>modelRecords;
        }
        catch (e) {
            this._logger.error(`Failed to parse data for "${model}"`);
            throw e;
        }
    }
    
    
    /*
     * Persistance logic
     */
    public async persistChanges (dataMap : DbData)
    {
        // merge with existing
        Object.assign(this._toPersist, dataMap);
        
        return this._saveToFiles();
    }
    
    protected async _saveToFiles ()
    {
        if (this._persistancePromise) {
            this._logger.debug('Persistance queued');
            
            // prevent simultaneous exec
            return this._persistancePromise;
        }
        
        const toPersist : ToPersist = this._flushToPersistEntries();
        
        this._persistancePromise = new Promise<void>(async(resolve, reject) => {
            this._logger.debug('Persist started', Object.keys(toPersist));
            
            try {
                const childPromises = [];
                
                for (const [ modelName, records ] of Object.entries(toPersist)) {
                    // save to file
                    const tableStoragePath = path.join(
                        this._storagePath,
                        modelName + '.json'
                    );
                    
                    const plainRecords = serializer.toPlain(records, {
                        groups: [ ExposeGroup.Storage ],
                    });
                    const contentRaw = JSON.stringify(plainRecords, null, 4);
                    
                    const childPromise = fs.writeFile(
                        tableStoragePath,
                        contentRaw,
                        { encoding: 'utf8' }
                    );
                    
                    childPromises.push(childPromise);
                }
                
                if (childPromises.length) {
                    await Promise.all(childPromises);
                }
                
                this._logger.debug('Persist done');
                
                // release lock
                this._persistancePromise = null;
                
                // if meanwhile anything was queued - call again
                const requiresFlush = Object.values(this._toPersist).length > 0;
                if (requiresFlush) {
                    this._logger.debug('Queued call', this._toPersist);
                    await this._saveToFiles();
                }
                
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
        
        return this._persistancePromise;
    }
    
    protected _flushToPersistEntries () : ToPersist
    {
        const toPersist = this._toPersist;
        this._toPersist = {};
        return toPersist;
    }
    
}
