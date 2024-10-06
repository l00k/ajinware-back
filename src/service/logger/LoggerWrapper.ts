import { Inject } from '@inti5/object-manager';
import type { Logger } from './Logger.js';


export class LoggerWrapper
{
    
    @Inject('logger')
    protected _logger : Logger;
    
    protected _serviceName : string;
    
    public constructor (serviceName? : string)
    {
        this._serviceName = '[' + (serviceName ?? 'Unknown') + ']';
    }
    
    public debug (...args : any[]) { this._logger.debug(this._serviceName, ...args); }
    public log (...args : any[]) { this._logger.log(this._serviceName, ...args); }
    public info (...args : any[]) { this._logger.info(this._serviceName, ...args); }
    public warn (...args : any[]) { this._logger.warn(this._serviceName, ...args); }
    public error (...args : any[]) { this._logger.error(this._serviceName, ...args); }
    
}
