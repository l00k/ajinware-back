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
        port: 3050,
        basePath: '/api/',
    },
    logger: {
        logLevel: LogLevel.Debug,
        storagePath: '@/.storage/logs/dev/',
    },
    db: {
        storagePath: '@/.storage/db/dev/',
        models: () => [
            Coaster,
        ]
    }
};

export default config;
