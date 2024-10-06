import type { ApiConfig } from '$/service/api/index.js';
import type { DbConfig } from '$/service/db/index.js';
import type { LoggerConfig } from '$/service/logger/index.js';
import type { SyncConfig } from '$/service/sync/def.js';

export type Config = {
    srcPath : string,
    sync : SyncConfig,
    api : ApiConfig,
    logger : LoggerConfig,
    db : DbConfig,
}
