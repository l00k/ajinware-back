import type { Config } from '$/etc/config/def.js';
import { Configuration } from '@inti5/configuration';
import { ObjectManager } from '@inti5/object-manager';
import fs from 'node:fs';
import path from 'node:path';


export function clearStorage ()
{
    const env = process.env.APP_ENV;
    
    const dbPath = path.join('.storage/db', env);
    if (fs.existsSync(dbPath)) {
        fs.rmSync(dbPath, { recursive: true });
    }
    
    const logsPath = path.join('.storage/logs', env);
    if (fs.existsSync(logsPath)) {
        fs.rmSync(logsPath, { recursive: true });
    }
}

const configuration = Configuration.getSingleton();
const objectManager = ObjectManager.getSingleton();

export async function prepareConfig ()
{
    configuration['_data'] = {};
    
    // load base config
    const env = process.env.APP_ENV;
    
    const baseConfig = await import(`$/etc/config/${env}.js`);
    configuration.load(baseConfig.default);
}

export function extendConfig (config? : RecursivePartial<Config>)
{
    configuration.load(config);
}

export async function prepareServices ()
{
    objectManager['_services'] = {};

    const servicesMod = await import('$/etc/services.js');
    for (const [ name, serviceFn ] of Object.entries(servicesMod.default)) {
        const service = await serviceFn();
        objectManager.bindService(service, name);
    }
}
