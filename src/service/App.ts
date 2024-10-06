import { ApiService } from '$/service/api/index.js';
import { LoggerWrapper } from '$/service/logger/index.js';
import { MonitoringService } from '$/service/MonitoringService.js';
import { sleep } from '$/utils/sleep.js';
import { Inject } from '@inti5/object-manager';

export class App
{
    
    @Inject(() => LoggerWrapper, [ 'App' ])
    protected _logger : LoggerWrapper;
    
    @Inject(() => ApiService)
    protected _apiService : ApiService;
    
    @Inject(() => MonitoringService)
    protected _monitoringService : MonitoringService;
    
    protected _running : boolean = true;
    
    
    public async run () : Promise<number>
    {
        await this._apiService.start();
        
        this._logger.debug('Running monitoring service in 5 seconds');
        await sleep(5000);
        
        while (this._running) {
            this._monitoringService.print();
            await sleep(1000);
        }
        
        await this._apiService.stop();
        
        return 0;
    }
    
    public async stop () : Promise<void>
    {
        this._running = false;
        this._logger.debug('Stopping application');
    }
    
}
