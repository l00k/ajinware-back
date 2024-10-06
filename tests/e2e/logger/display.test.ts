import { extendConfig } from '#/utils.js';
import { Logger } from '$/service/logger/index.js';
import { LogLevel } from '$/service/logger/index.js';
import { ObjectManager } from '@inti5/object-manager';
import sinon from 'sinon';


describe('Logger / Display', () => {
    let logger : Logger;
    
    beforeEach(async() => {
        await extendConfig({
            logger: {
                logLevel: LogLevel.Warn
            }
        });
        
        logger = ObjectManager.getSingleton().getInstance(Logger);
    });
    
    it('Should display messages with priority higher than allowed', () => {
        const spy = sinon.spy(console, 'warn');
        
        logger.warn('This is a warning');
        
        expect(spy).to.be.calledOnce;
        
        const call = spy.getCall(0);
        expect(call.args[2]).to.be.eq('This is a warning');
        
        spy.restore();
    });
    
    it('Should not display messages with priority lower than allowed', () => {
        const spy = sinon.spy(console, 'log');
        
        logger.log('This is a log');
        
        expect(spy).to.not.be.called;
        
        spy.restore();
    });
});
