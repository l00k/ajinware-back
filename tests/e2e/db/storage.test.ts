import { extendConfig } from '#/utils.js';
import { prepareServices } from '#/utils.js';
import { Coaster } from '$/model/Coaster.js';
import { Wagon } from '$/model/Wagon.js';
import { Database } from '$/service/db/Database.js';
import { LogLevel } from '$/service/logger/index.js';
import { ObjectManager, ReleaseSymbol } from '@inti5/object-manager';
import fs from 'node:fs';
import path from 'node:path';


describe('Database / Storage', () => {
    let db : Database;
    
    beforeEach(async() => {
        extendConfig({
            logger: {
                logLevel: LogLevel.None
            }
        });
        
        await prepareServices();
        
        db = ObjectManager.getSingleton().getService('db');
    });
    
    function assertAndReadDb (modelName : string)
    {
        const tableFilePath = path.join('.storage/db/test/' + modelName + '.json');
        expect(fs.existsSync(tableFilePath)).to.be.true;
        
        const tableContent = fs.readFileSync(tableFilePath, { encoding: 'utf8' });
        return JSON.parse(tableContent);
    }
    
    it('Should store inserted records', async() => {
        const coaster = new Coaster({
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
            wagons: [
                new Wagon({
                    seatNumber: 32,
                    speed: 1.2,
                })
            ]
        });
        db.save(coaster);
        
        await db.flush();
        
        const records = assertAndReadDb('coaster');
        
        expect(records.length).to.be.eq(1);
        expect(records).to.containSubset([
            {
                '@type': 'Coaster',
                personelNumber: 16,
                customerNumber: 60000,
                routeLength: 1800,
                workingHourFrom: 8,
                workingHourTo: 16,
                wagons: [
                    {
                        '@type': 'Wagon',
                        seatNumber: 32,
                        speed: 1.2
                    }
                ]
            }
        ]);
        expect(records[0].id).to.be.not.undefined;
        expect(records[0].wagons[0].id).to.be.not.undefined;
    });
    
    it('Should not store changes if not flushed', async() => {
        const coaster = new Coaster({
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
            wagons: [
                new Wagon({
                    seatNumber: 32,
                    speed: 1.2,
                })
            ]
        });
        db.save(coaster);
        
        // simulate destruction
        await db['_persistanceProvider'][ReleaseSymbol]();
        
        const tableFilePath = path.join('.storage/db/test/coaster.json');
        expect(fs.existsSync(tableFilePath)).to.be.false;
    });
    
    it('Should store inserted records via batch', async() => {
        const coaster1 = new Coaster({
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
            wagons: [
                new Wagon({
                    seatNumber: 32,
                    speed: 1.2,
                })
            ]
        });
        db.save(coaster1);
        
        const coaster2 = new Coaster({
            personelNumber: 8,
            customerNumber: 30000,
            routeLength: 900,
            workingHourFrom: 4,
            workingHourTo: 8,
            wagons: [
                new Wagon({
                    seatNumber: 16,
                    speed: 1.2,
                })
            ]
        });
        db.save(coaster2);
        
        await db.flush();
        
        const records = assertAndReadDb('coaster');
        
        expect(records.length).to.be.eq(2);
    });
    
    describe('with existing records', () => {
        let coaster1 : Coaster;
        
        beforeEach(async() => {
            coaster1 = new Coaster({
                personelNumber: 16,
                customerNumber: 60000,
                routeLength: 1800,
                workingHourFrom: 8,
                workingHourTo: 16,
                wagons: [
                    new Wagon({
                        seatNumber: 32,
                        speed: 1.2,
                    })
                ]
            });
            db.save(coaster1);
            
            await db.flush();
        });
        
        it('Should load records after db recreation', async() => {
            await prepareServices();
            db = ObjectManager.getSingleton().getService('db');
            
            const obj = db.findOne(Coaster, { personelNumber: 16 });
            expect(obj).to.be.not.undefined;
            expect(obj).to.be.instanceOf(Coaster);
        });
        
        it('Should store further inserted records', async() => {
            const coaster2 = new Coaster({
                personelNumber: 16,
                customerNumber: 60000,
                routeLength: 1800,
                workingHourFrom: 8,
                workingHourTo: 16,
            });
            db.save(coaster2);
            
            await db.flush();
            
            const records = assertAndReadDb('coaster');
            
            expect(records.length).to.be.eq(2);
        });
        
        it('Should store updated records', async() => {
            coaster1.personelNumber = 8;
            db.save(coaster1);
            
            await db.flush();
            
            const records = assertAndReadDb('coaster');
            
            expect(records.length).to.be.eq(1);
            expect(records).to.containSubset([
                {
                    personelNumber: 8
                }
            ]);
        });
        
        it('Should store deleted records', async() => {
            db.delete(coaster1);
            
            await db.flush();
            
            const records = assertAndReadDb('coaster');
            
            expect(records.length).to.be.eq(0);
        });
    });
});
