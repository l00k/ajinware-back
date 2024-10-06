import { prepareConfig } from '#/utils.js';
import { clearStorage } from '#/utils.js';
import { Configuration } from '@inti5/configuration';
import { ObjectManager } from '@inti5/object-manager';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';
import sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(sinonChai);

declare const global : any;
(<any>global).expect = chai.expect;

declare global
{
    // @ts-ignore
    const expect : Chai.ExpectStatic;
}


beforeEach(async() => {
    process.env.APP_ENV = 'test';
    
    // prepare object manager
    const configuration = Configuration.getSingleton();
    const objectManager = ObjectManager.getSingleton();
    
    objectManager.registerHandler(
        configuration
            .injectConfigurationValues
            .bind(configuration)
    );
    
    clearStorage();
    
    await prepareConfig();
});
