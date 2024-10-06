import { App } from '$/service/App.js';
import { LoggerWrapper } from '$/service/logger/index.js';
import { Configuration } from '@inti5/configuration';
import { ObjectManager } from '@inti5/object-manager';
import path from 'node:path';

export class Bootstrap
{
    
    public async start ()
    {
        // prepare object manager
        const configuration = Configuration.getSingleton();
        const objectManager = ObjectManager.getSingleton();
        
        objectManager.registerHandler(
            configuration
                .injectConfigurationValues
                .bind(configuration)
        );
        
        // get env
        const env = process.env.APP_ENV ?? 'local';
        
        // load configuration
        const configPath = path.join(
            import.meta.dirname,
            `../etc/config/${env}.js`
        );
        
        const config = await import(configPath);
        configuration.load(config.default);
        
        // prepare services
        const servicesMod = await import('$/etc/services.js');
        for (const [ name, serviceFn ] of Object.entries(servicesMod.default)) {
            const service = await serviceFn();
            objectManager.bindService(service, name);
        }
        
        // prepare process trap
        const logger = ObjectManager.getSingleton()
            .getInstance(LoggerWrapper, [ 'Bootstrap' ]);
        
        // register process traps
        process.on('SIGINT', async() => {
            await objectManager.releaseAll();
            logger.debug('Exiting with code', resultCode);
            process.exit(0);
        });
        
        // run app
        const app = objectManager.getInstance(App);
        
        let resultCode = 0;
        try {
            resultCode = await app.run();
        }
        catch (e) {
            logger.error(e);
            resultCode = 1;
        }
        
        // release objects
        await objectManager.releaseAll();
        
        logger.debug('Exiting with code', resultCode);
        
        process.exit(resultCode);
    }
    
}
