import { Coaster } from '$/model/Coaster.js';
import type { Database } from '$/service/db/index.js';
import { Inject } from '@inti5/object-manager';

export class MonitoringService
{
    
    @Inject('db')
    protected _db : Database;
    
    
    public print ()
    {
        const coasters = this._db.find(
            Coaster,
            {},
            [],
            { offset: 0, limit: 1000 }
        );
        
        console.clear();
        
        const time = new Date().toTimeString().substring(0, 5);
        console.log(`[Godzina ${time}]`);
        
        for (const coaster of coasters) {
            console.log(`[Kolejka ${coaster.name}]`.magenta);
            
            console.log(
                '\t',
                'Godziny działania:',
                coaster.getWorkingHourFromFormat(),
                '-',
                coaster.getWorkingHourToFormat(),
            );
            
            const activeWagonsNumber = coaster.getActiveWagonsNumber();
            console.log(
                '\t',
                'Liczba wagonów:',
                activeWagonsNumber,
                '/',
                coaster.wagons.length,
            );
            
            console.log(
                '\t',
                'Dostępny personel:',
                coaster.personelNumber,
                '/',
                coaster.getRequiredPersonelNumber(),
            );
            
            const currentCustomerCapacity = coaster.getCustomersCapacity();
            console.log(
                '\t',
                'Klienci dziennie:',
                currentCustomerCapacity,
                '/',
                coaster.customerNumber,
            );
            
            // detect status
            const problems = [];
            
            const requiredPersonelNumber = coaster.getRequiredPersonelNumber();
            const missingPersonel = coaster.personelNumber - requiredPersonelNumber;
            if (missingPersonel > 0) {
                problems.push(`Nadmiar ${missingPersonel} pracowników dla dostępnych wagonów`);
            }
            if (missingPersonel < 0) {
                problems.push(`Brak ${-missingPersonel} pracowników do uruchomienia wszystkich wagonów`);
            }
            
            const nonActiveWagons = coaster.wagons.length - coaster.getActiveWagonsNumber();
            if (nonActiveWagons > 0) {
                problems.push(`Nadmiarowe wagony ${nonActiveWagons}`);
            }
            
            if (currentCustomerCapacity < coaster.customerNumber) {
                const missingWagons = coaster.getMissingWagons();
                problems.push(`Brak ${missingWagons} wagonów do obsłużenia wszystkich klientów`);
            }
            else if (currentCustomerCapacity > coaster.customerNumber) {
                const excessWagons = coaster.getExcessWagons();
                if (excessWagons > 0) {
                    problems.push(`Nadmiarowe wagony ${excessWagons}`);
                }
            }
            
            if (problems.length) {
                console.log('\t', 'Problem:'.red);
                for (const problem of problems) {
                    console.log('\t\t', problem.red);
                }
            }
            else {
                console.log('\t', 'Status: OK'.green);
            }
        }
    }
    
}
