import { ExposeGroup } from '$/model/ExposeGroup.js';
import { LoggerWrapper } from '$/service/logger/index.js';
import type { Message, MessageHandler, SyncConfig } from '$/service/sync/def.js';
import { NodeMode } from '$/service/sync/def.js';
import { Exception } from '$/utils/Exception.js';
import { sleep } from '$/utils/sleep.js';
import { Config } from '@inti5/configuration';
import { Inject, ReleaseSymbol } from '@inti5/object-manager';
import type { RedisClientType } from 'redis';
import * as redis from 'redis';
import { serializer } from 'serialzr';


export class SyncProvider
{
    
    protected static readonly MASTER_KEY : string = 'master';
    protected static readonly PEERS_SET : string = 'peers';
    protected static readonly PEER_HEARTBEAT : string = 'heartbeat';
    
    protected static readonly STREAM_KEY : string = 'stream';
    
    
    @Inject(() => LoggerWrapper, [ 'SyncProvider' ])
    protected _logger : LoggerWrapper;
    
    @Config('sync')
    protected _config : SyncConfig;
    
    protected _lifecycleClient : RedisClientType;
    protected _subClient : RedisClientType;
    protected _pubClient : RedisClientType;
    
    protected _isConnected : boolean = false;
    protected _currentMode : NodeMode = null;
    protected _lifecycleInterval : NodeJS.Timeout;
    
    protected _subscribedScopes : Set<NodeMode> = new Set();
    
    protected _messageHandlers : Record<NodeMode, MessageHandler>;
    
    
    public get isConnected () : boolean
    {
        return this._isConnected;
    }
    
    
    public async [ReleaseSymbol] ()
    {
        await this.stop();
    }
    
    
    public async init ()
    {
        try {
            await this._setupConnections();
        }
        catch (e) {
            this._logger.warn('Failed to connect to Redis:', e);
            this._logger.info('Running in local mode');
        }
    }
    
    
    protected async _setupConnections () : Promise<void>
    {
        this._logger.debug('Connecting to Redis...');
        
        this._lifecycleClient = await this._connectClient('lifecycle');
        this._subClient = await this._connectClient('sub');
        this._pubClient = await this._connectClient('pub');
        
        await this._announceConnection();
        
        this._isConnected = true;
        
        this._lifecycleInterval = setInterval(async() => {
            try {
                await this._lifecycleProcess();
            }
            catch (err) {
                this._logger.error('Failed to send heartbeat:', err);
            }
        }, 5_000);
    }
    
    protected async _connectClient (variant : string) : Promise<RedisClientType>
    {
        const client : RedisClientType = redis.createClient({
            url: this._config.url,
        });
        
        client.on('connect', () => {
            this._logger.debug(`Connected to Redis in "${variant}" mode`);
        });
        
        client.on('disconnect', async() => {
            this._logger.debug(`Disconnected from Redis in "${variant}" mode`);
            
            // try to reconnect
            await sleep(3_000);
            
            await client.connect();
        });
        
        await client.connect();
        
        return client;
    }
    
    public async stop () : Promise<void>
    {
        if (this._lifecycleClient) {
            await this._announceDisconnection();
            
            await this._lifecycleClient.quit();
            this._lifecycleClient = null;
        }
        
        if (this._subClient) {
            await this._subClient.quit();
            this._subClient = null;
        }
        
        if (this._pubClient) {
            await this._pubClient.quit();
            this._pubClient = null;
        }
        
        if (this._lifecycleInterval) {
            clearInterval(this._lifecycleInterval);
        }
    }
    
    
    public registerMessageHandlers (
        onMasterMessage : MessageHandler,
        onSlaveMessage : MessageHandler,
    )
    {
        this._messageHandlers = {
            [NodeMode.Master]: onMasterMessage,
            [NodeMode.Slave]: onSlaveMessage,
        };
    }
    
    
    public async publish (
        resource : any,
        originProxied? : string,
    ) : Promise<void>
    {
        if (!this._isConnected) {
            throw new Exception('Not connected to Redis', 1728209963246);
        }
        
        // get type
        const type = serializer.getTypeName(resource.constructor);
        
        let streamKey : string;
        if (this._currentMode === NodeMode.Master) {
            // current node is master
            // broadcast to all peers
            streamKey = this._getResourceKey(NodeMode.Slave);
        }
        else {
            // send to master node
            streamKey = this._getResourceKey(NodeMode.Master);
        }
        
        // serialize resource
        const resourcePlain = serializer.toPlain(resource, {
            groups: [
                ExposeGroup.Sync,
            ]
        });
        
        // stringify message and publish
        const message : Message = {
            type,
            origin: this._config.peerId,
            originProxied,
            resource: resourcePlain
        };
        const messageTxt = JSON.stringify(message);
        
        this._logger.debug(`Publishing message in ${streamKey}`);
        this._logger.debug(message);
        
        await this._pubClient.publish(streamKey, messageTxt);
    }
    
    protected _getResourceKey (scope : NodeMode, type? : string) : string
    {
        return SyncProvider.STREAM_KEY + '_' + scope
            + (type ? (':' + type) : '')
            ;
    }
    
    
    /*
     * Lifecycle & master node election methods
     */
    
    protected async _announceConnection ()
    {
        await this._lifecycleClient.sAdd(SyncProvider.PEERS_SET, this._config.peerId);
        await this._lifecycleProcess();
    }
    
    protected async _announceDisconnection ()
    {
        this._logger.debug('Announcing disconnection');
        
        await this._lifecycleClient.sRem(SyncProvider.PEERS_SET, this._config.peerId);
        
        if (this._currentMode === NodeMode.Master) {
            await this._lifecycleClient.del(SyncProvider.MASTER_KEY);
        }
    }
    
    protected async _lifecycleProcess ()
    {
        try {
            await this._sendHeartbeat();
        }
        catch (e) {
            this._logger.error('Failed to send heartbeat:', e);
        }
        
        try {
            await this._masterNodeElection();
        }
        catch (e) {
            this._logger.error('Failed to elect master node:', e);
        }
    }
    
    protected async _masterNodeElection ()
    {
        const masterKey = await this._lifecycleClient.get(SyncProvider.MASTER_KEY);
        
        if (!masterKey) {
            // No master exists, become the master
            this._logger.debug('Becoming a master node');
            
            await this._lifecycleClient.set(SyncProvider.MASTER_KEY, this._config.peerId, {
                EX: 10, // Expire in 10 seconds
                NX: true,
            });
            
            if (this._currentMode !== NodeMode.Master) {
                await this._prepareMasterNode();
            }
        }
        else if (masterKey === this._config.peerId) {
            // current node is master
            if (this._currentMode !== NodeMode.Master) {
                // this node was slave so prepare it as master
                await this._prepareMasterNode();
            }
        }
        else {
            // current node is slave
            if (this._currentMode !== NodeMode.Slave) {
                // this node was master, but for some reason it lost the master key
                await this._prepareSlaveNode();
            }
        }
    }
    
    protected async _sendHeartbeat ()
    {
        const key = SyncProvider.PEER_HEARTBEAT + ':' + this._config.peerId;
        await this._lifecycleClient.set(key, Date.now(), {
            EX: 10,
        });
        
        if (this._currentMode === NodeMode.Master) {
            await this._lifecycleClient.set(SyncProvider.MASTER_KEY, this._config.peerId, {
                EX: 10,
            });
        }
    }
    
    protected async _prepareSlaveNode ()
    {
        this._logger.debug('Preparing slave node');
        
        this._currentMode = NodeMode.Slave;
        
        if (this._subscribedScopes.has(NodeMode.Master)) {
            await this._unsubscribeStream(NodeMode.Master);
        }
        
        await this._subscribeStream(NodeMode.Slave);
    }
    
    protected async _prepareMasterNode ()
    {
        this._logger.debug('Preparing master node');
        
        this._currentMode = NodeMode.Master;
        
        if (this._subscribedScopes.has(NodeMode.Slave)) {
            await this._unsubscribeStream(NodeMode.Slave);
        }
        
        await this._subscribeStream(NodeMode.Master);
    }
    
    
    /*
     * Stream methods
     */
    protected async _subscribeStream (scope : NodeMode)
    {
        const streamKey = this._getResourceKey(scope);
        
        this._logger.debug('Subscribing to stream', streamKey);
        
        await this._subClient.subscribe(streamKey, async(messageTxt) => {
            const messageRaw : Message = JSON.parse(messageTxt);
            if (
                messageRaw?.origin === this._config.peerId
                || messageRaw?.originProxied === this._config.peerId
            ) {
                // ignore own messages
                return;
            }
            
            this._logger.debug(`Received message in scope "${scope}"`);
            this._logger.debug(messageRaw);
            
            if (!messageRaw.type || !messageRaw.resource) {
                throw new Exception('Invalid message format', 1728207557488);
            }
            
            // deserialize resource
            const resourceClass = serializer.getTypeByName(messageRaw.type);
            if (!resourceClass) {
                throw new Exception('Resource class not found', 1728208149786);
            }
            
            const message : Message = messageRaw;
            message.resource = serializer.toClass(message.resource, {
                type: resourceClass,
                groups: [
                    ExposeGroup.Sync,
                ]
            });
            
            const messageHandler = this._messageHandlers[scope];
            if (messageHandler) {
                await messageHandler(message);
            }
        });
        
        this._subscribedScopes.add(scope);
    }
    
    protected async _unsubscribeStream (scope : NodeMode)
    {
        const streamKey = this._getResourceKey(scope);
        await this._subClient.unsubscribe(streamKey);
        
        this._subscribedScopes.delete(scope);
    }
    
}
