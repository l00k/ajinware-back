import { extendConfig } from '#/utils.js';
import { Logger } from '$/service/logger/index.js';
import { LogLevel } from '$/service/logger/index.js';
import { ObjectManager } from '@inti5/object-manager';
import fs from 'node:fs';
import path from 'node:path';


describe('Logger / Storage', () => {
    let logger : Logger;
    
    beforeEach(async() => {
        await extendConfig({
            logger: {
                logLevel: LogLevel.Warn
            }
        });
        
        logger = ObjectManager.getSingleton().getInstance(Logger);
    });
    
    it('Should store messages in files with priority higher than allowed', async() => {
        logger.warn('This is a warning');
        
        if (logger['_persistancePromise']) {
            await logger['_persistancePromise'];
        }
        
        const logFilePath = path.join('.storage/logs/test/warn.log');
        const lines = fs.readFileSync(logFilePath, 'utf8').split('\n');
        
        const found = lines.some(line => line.includes('This is a warning'));
        expect(found).to.be.true;
    });
    
    it('Should not store messages in files with priority lower than allowed', async() => {
        logger.log('This is a log');
        
        if (logger['_persistancePromise']) {
            await logger['_persistancePromise'];
        }
        
        const logFilePath = path.join('.storage/logs/test/log.log');
        expect(fs.existsSync(logFilePath)).to.be.false;
    });
});
