import { Coaster } from '$/model/Coaster.js';
import type { AbstractModel, Database } from '$/service/db/index.js';
import { LoggerWrapper } from '$/service/logger/index.js';
import type { Message } from '$/service/sync/def.js';
import { InitializeSymbol, Inject } from '@inti5/object-manager';
import type { SyncProvider } from './SyncProvider.js';

export class SyncManager
{
    
    @Inject(() => LoggerWrapper, [ 'SyncManager' ])
    protected _logger : LoggerWrapper;
    
    @Inject('syncProvider')
    protected _syncProvider : SyncProvider;
    
    @Inject('db')
    protected _db : Database;
    
    
    public [InitializeSymbol] ()
    {
        this._syncProvider.registerMessageHandlers(
            this._onMasterMessage.bind(this),
            this._onSlaveMessage.bind(this),
        );
    }
    
    public async publish (
        model : AbstractModel,
        previousOrigin? : string,
    )
    {
        if (!this._syncProvider.isConnected) {
            // not connected - just ignore
            return null;
        }
        
        return this._syncProvider.publish(model, previousOrigin);
    }
    
    /**
     * Called when current node is master, and it receives a message form slave
     */
    protected async _onMasterMessage (message : Message)
    {
        this._logger.debug(`Received MASTER message ${message.type} from "${message.origin}"`);
        this._logger.debug(message.resource);
        
        // update locally
        if (
            message.resource instanceof Coaster
            && message.resource.id
        ) {
            await this._saveOrUpdateCoaster(message.resource);
        }
        
        // currently no further processing is required
        // just publish again - it will be populated to all peers
        await this.publish(message.resource, message.origin);
    }
    
    /**
     * Called when current node is slave, and it receives a message from master
     */
    protected async _onSlaveMessage (message : Message)
    {
        this._logger.debug(`Received SLAVE message ${message.type} from "${message.origin}"`);
        
        // update locally
        if (
            message.resource instanceof Coaster
            && message.resource.id
        ) {
            await this._saveOrUpdateCoaster(message.resource);
        }
    }
    
    /*
     * Handle Coaster updates
     */
    protected async _saveOrUpdateCoaster (coaster : Coaster)
    {
        const existing = this._db.getById(Coaster, coaster.id);
        if (existing) {
            Object.assign(existing, coaster);
            this._db.save(existing);
        }
        else {
            this._db.save(coaster);
        }
        
        await this._db.flush();
    }
    
}
