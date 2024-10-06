import type { ClusterOperation, DbConfig, Operation } from '$/service/db/def.js';
import { Config } from '@inti5/configuration';

type OperationCb = (operationsBatch : ClusterOperation[]) => void;

export class SyncProvider
{
    
    @Config('peerId')
    protected _peerId : string;
    
    @Config('db')
    protected _config : DbConfig;
    
    
    protected _tmp : OperationCb[] = [];
    
    
    public async subscribe (
        peerId : string,
        callback : OperationCb,
    ) : Promise<void>
    {
        this._tmp.push(callback);
    }
    
    public async publish (operationsBatch : Operation[]) : Promise<void>
    {
        const clusterOperations : ClusterOperation[] = operationsBatch.map(
            operation => ({
                operation,
                peerId: this._peerId,
            }),
        );
    
        for (const cb of this._tmp) {
            cb(clusterOperations);
        }
    
        // aquiring lock
        
        // push operations to stream
        
        // releasing lock
    }
    
    public async waitForSync () : Promise<void>
    {
    
    }
    
}
