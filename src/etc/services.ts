import { Database } from '$/service/db/index.js';
import { Logger } from '$/service/logger/index.js';
import { SyncManager, SyncProvider } from '$/service/sync/index.js';
import { ObjectManager } from '@inti5/object-manager';

const objectManager = ObjectManager.getSingleton();

const services : Record<string, AsyncAnyFn | AnyFn> = {
    logger: () => objectManager.getInstance(Logger),
    db: async() => {
        const db = objectManager.getInstance(Database);
        await db.init();
        return db;
    },
    syncProvider: async() => {
        const sync = objectManager.getInstance(SyncProvider);
        await sync.init();
        return sync;
    },
    syncManager: () => objectManager.getInstance(SyncManager),
};

export default services;
