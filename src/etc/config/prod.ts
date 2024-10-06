import { Coaster } from '$/model/Coaster.js';
import { LogLevel } from '$/service/logger/def.js';
import path from 'node:path';
import type { Config } from './def.js';

const config : RecursivePartial<Config> = {
    srcPath: path.join(process.cwd(), 'dist'),
    sync: {
        url: process.env.REDIS_URL ?? 'redis://default@localhost:6379',
        peerId: process.env.PEER_ID ?? 'main',
    },
    api: {
        port: 3051,
        basePath: '/api/',
    },
    logger: {
        logLevel: LogLevel.Warn,
        storagePath: '@/.storage/logs/prod/',
    },
    db: {
        storagePath: '@/.storage/db/prod/',
        models: () => [
            Coaster,
        ]
    }
};

export default config;
