import { Coaster } from '$/model/Coaster.js';
import { Wagon } from '$/model/Wagon.js';

describe('Unit / Coaster', () => {
    let coaster : Coaster;
    
    beforeEach(() => {
        coaster = new Coaster({
            personelNumber: 5,
            routeLength: 1000,
            workingHourFrom: 8,
            workingHourTo: 16,
            customerNumber: 2000,
            wagons: [
                new Wagon({
                    seatNumber: 32,
                    speed: 2.0,
                }),
                new Wagon({
                    seatNumber: 32,
                    speed: 1.2,
                }),
                new Wagon({
                    seatNumber: 32,
                    speed: 1.2,
                }),
            ]
        });
    });
    
    it('Should properly return workingHourFromFormat', () => {
        expect(coaster.getWorkingHourFromFormat()).to.be.eq('08:00');
    });
    
    it('Should properly return workingHourToFormat', () => {
        expect(coaster.getWorkingHourToFormat()).to.be.eq('16:00');
    });
    
    it('Should properly return activeWagonsCount', () => {
        expect(coaster.getActiveWagonsNumber()).to.be.eq(2);
    });
    
    it('Should properly return requiredPersonelNumber', () => {
        expect(coaster.getRequiredPersonelNumber()).to.be.eq(7);
    });
    
    it('Should properly return requiredPersonelNumber', () => {
        expect(coaster.getCustomersCapacity()).to.be.eq(2752);
    });
    
    it('Should properly return excessWagons', () => {
        coaster.customerNumber = 1500;
        expect(coaster.getExcessWagons()).to.be.eq(1);
    });
    
    it('Should properly return missingWagons', () => {
        coaster.wagons = [];
        expect(coaster.getMissingWagons()).to.be.eq(0);
    });
    
    it('Should properly return missingWagons', () => {
        coaster.customerNumber = 10000;
        expect(coaster.getMissingWagons()).to.be.eq(7);
    });
    
    it('Should properly return missingWagons', () => {
        coaster.customerNumber = 2000;
        expect(coaster.getMissingWagons()).to.be.eq(0);
    });
});
