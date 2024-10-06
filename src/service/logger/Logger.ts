import { LogLevel, LogLevelColor, LogLevelNames, LogLevels } from '$/service/logger/def.js';
import type { LoggerConfig } from '$/service/logger/def.js';
import { Exception } from '$/utils/Exception.js';
import { Config } from '@inti5/configuration';
import { InitializeSymbol, ReleaseSymbol } from '@inti5/object-manager';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'colour';


type ToPersist = Omit<Record<LogLevel, string[]>, LogLevel.None>;


export class Logger
{
    
    @Config('logger')
    protected _config : LoggerConfig;
    
    protected _storagePaths : PartRecord<LogLevel, string> = {};
    
    protected _toPersist : ToPersist;
    protected _persistancePromise : Promise<void>;
    
    
    public constructor ()
    {
        this._flushToPersistEntries();
    }
    
    public [InitializeSymbol] ()
    {
        // prepare directories
        const storageRootPath = path.resolve(
            this._config.storagePath.replace('@', process.cwd())
        );
        
        if (!fsSync.existsSync(storageRootPath)) {
            fsSync.mkdirSync(storageRootPath, { recursive: true });
        }
        
        // prepare files
        for (const logLevel of LogLevels) {
            if (logLevel < this._config.logLevel) {
                continue;
            }
            
            const filePath = path.join(
                storageRootPath,
                LogLevelNames[logLevel] + '.log'
            );
            
            this._storagePaths[logLevel] = filePath;
            
            if (!fsSync.existsSync(filePath)) {
                fsSync.writeFileSync(filePath, '', { encoding: 'utf8' });
            }
        }
    }
    
    public async [ReleaseSymbol] ()
    {
        if (this._persistancePromise) {
            await this._persistancePromise;
        }
    }
    
    
    public debug (...args : any[]) { this._handle(LogLevel.Debug, args); }
    public log (...args : any[]) { this._handle(LogLevel.Log, args); }
    public info (...args : any[]) { this._handle(LogLevel.Info, args); }
    public warn (...args : any[]) { this._handle(LogLevel.Warn, args); }
    public error (...args : any[]) { this._handle(LogLevel.Error, args); }
    
    
    protected _handle (logLevel : LogLevel, args : any[])
    {
        if (logLevel < this._config.logLevel) {
            return;
        }
        
        // display
        const logLevelName = LogLevelNames[logLevel];
        const logColor = LogLevelColor[logLevel];
        
        console[logLevelName](
            new Date().toISOString(),
            (`[${LogLevelNames[logLevel]}]`)[logColor],
            ...args,
        );
        
        // persist
        this._persistRequest(logLevel, [
            new Date().toISOString(),
            '[' + LogLevelNames[logLevel] + ']',
            ...args,
        ]);
    }
    
    
    /*
     * Persistance logic
     */
    protected _flushToPersistEntries () : ToPersist
    {
        const toPersist = this._toPersist;
        
        this._toPersist = {
            [LogLevel.Debug]: [],
            [LogLevel.Log]: [],
            [LogLevel.Info]: [],
            [LogLevel.Warn]: [],
            [LogLevel.Error]: []
        };
        
        return toPersist;
    }
    
    protected _persistRequest (logLevel : LogLevel, args : any[])
    {
        const logFilePath = this._storagePaths[logLevel];
        if (!logFilePath) {
            throw new Exception(
                `Invalid log level: ${logLevel}`,
                1727942821746
            );
        }
        
        const contentRaw = args
            .map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg))
            .join('\t') + '\n'
        ;
        
        this._toPersist[logLevel].push(contentRaw);
        
        // non-blocking request to save to files
        this._saveToFiles();
    }
    
    protected async _saveToFiles ()
    {
        if (this._persistancePromise) {
            // prevent simultaneous exec
            return this._persistancePromise;
        }
        
        const toPersist : ToPersist = this._flushToPersistEntries();
        
        this._persistancePromise = new Promise<void>(async(resolve, reject) => {
            try {
                const childPromises = [];
                
                for (const logLevel of LogLevels) {
                    const entries = toPersist[logLevel];
                    if (!entries.length) {
                        continue;
                    }
                    
                    const contentRaw = entries.join('');
                    const childPromise = fs.appendFile(
                        this._storagePaths[logLevel],
                        contentRaw,
                        { encoding: 'utf8' }
                    );
                    
                    childPromises.push(childPromise);
                }
                
                if (childPromises.length) {
                    await Promise.all(childPromises);
                }
                
                // release lock
                this._persistancePromise = null;
                
                // if meanwhile anything was queued - call again
                const requiresFlush = Object.values(this._toPersist)
                    .some(entries => entries.length > 0)
                ;
                if (requiresFlush) {
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
    
}
