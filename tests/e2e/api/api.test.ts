import { extendConfig } from '#/utils.js';
import { prepareServices } from '#/utils.js';
import type { Coaster } from '$/model/Coaster.js';
import type { Wagon } from '$/model/Wagon.js';
import { ApiService } from '$/service/api/index.js';
import { LogLevel } from '$/service/logger/index.js';
import { ObjectManager } from '@inti5/object-manager';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import qs from 'qs';


describe('API', () => {
    let api : ApiService;
    
    const client : AxiosInstance = axios.create({
        baseURL: 'http://localhost:3000/api',
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'brackets' }),
        validateStatus: () => true,
    });
    
    beforeEach(async() => {
        extendConfig({
            logger: {
                logLevel: LogLevel.None
            }
        });
        
        await prepareServices();
        
        api = ObjectManager.getSingleton().getInstance(ApiService);
        await api.start();
    });
    
    afterEach(async() => {
        await api.stop();
    });
    
    it('Should return proper 404 response', async() => {
        const data : Partial<Coaster> = {
            name: 'A1',
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
        };
        
        const response = await client.post('coastersxxx', data);
        
        expect(response.status).to.be.eq(404);
        expect(response.data).to.containSubset({
            result: 'Error',
            message: 'Not found',
            code: 1728197295847,
        });
    });
    
    it('Should be able to create coaster', async() => {
        const data : Partial<Coaster> = {
            name: 'A1',
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
        };
        
        const response = await client.post('coasters', data);
        
        expect(response.status).to.be.eq(200);
        expect(response.data).to.containSubset({
            '@type': 'Coaster',
            name: 'A1',
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
            wagons: []
        });
    });
    
    describe('With coaster created', () => {
        let coasterId : string;
        let coasterData : Partial<Coaster>;
        
        beforeEach(async() => {
            coasterData = {
                name: 'A1',
                personelNumber: 16,
                customerNumber: 60000,
                routeLength: 1800,
                workingHourFrom: 8,
                workingHourTo: 16,
            };
            
            const response = await client.post('coasters', coasterData);
            coasterId = response.data.id;
        });
        
        it('Should be able to get coaster', async() => {
            const response = await client.get(`coasters/${coasterId}`);
            
            expect(response.status).to.be.eq(200);
            expect(response.data).to.containSubset({
                '@type': 'Coaster',
                id: coasterId,
                name: 'A1',
                personelNumber: 16,
                customerNumber: 60000,
                routeLength: 1800,
                workingHourFrom: 8,
                workingHourTo: 16,
                wagons: []
            });
        });
        
        it('Should return 404 on non existing coaster / get', async() => {
            const response = await client.get(`coasters/ae89ede9-5a68-42c9-a2af-95f9e34db939`);
            
            expect(response.status).to.be.eq(404);
            expect(response.data).to.containSubset({
                code: 1728196562539,
                message: 'Coaster not found',
                result: 'Error',
            });
        });
        
        it('Should be able to get all coasters', async() => {
            const response = await client.get(`coasters`, {
                params: {
                    filters: {
                        name: 'A1'
                    },
                    order: [ { field: 'name', dir: 'ASC' } ],
                    pagination: { offset: 0, limit: 10 },
                }
            });
            
            expect(response.status).to.be.eq(200);
            expect(response.data).to.containSubset([
                {
                    '@type': 'Coaster',
                    id: coasterId,
                    name: 'A1',
                    personelNumber: 16,
                    customerNumber: 60000,
                    routeLength: 1800,
                    workingHourFrom: 8,
                    workingHourTo: 16,
                    wagons: []
                }
            ]);
        });
        
        it('Should be able to update coaster', async() => {
            const data : Partial<Coaster> = {
                id: 'ae89ede9-5a68-42c9-a2af-95f9e34db939', // should be ignored
                name: 'A2',
                personelNumber: 20,
                customerNumber: 60001,
                routeLength: 2000, // should be ignored
                workingHourFrom: 9,
                workingHourTo: 17,
            };
            
            const response = await client.put(`coasters/${coasterId}`, data);
            
            expect(response.status).to.be.eq(200);
            expect(response.data).to.containSubset({
                '@type': 'Coaster',
                id: coasterId,
                name: 'A2',
                personelNumber: 20,
                customerNumber: 60001,
                routeLength: coasterData.routeLength,
                workingHourFrom: 9,
                workingHourTo: 17,
                wagons: []
            });
        });
        
        it('Should properly validate updated coaster and not perform update', async() => {
            const data : Partial<Coaster> = {
                personelNumber: -20,
                routeLength: 2000, // should be ignored
            };
            
            const response = await client.put(`coasters/${coasterId}`, data);
            expect(response.status).to.be.eq(422);
            
            // check data is not changed
            {
                const response = await client.get(`coasters/${coasterId}`);
                
                expect(response.status).to.be.eq(200);
                expect(response.data).to.containSubset({
                    '@type': 'Coaster',
                    id: coasterId,
                    name: 'A1',
                    personelNumber: 16,
                    customerNumber: 60000,
                    routeLength: 1800,
                    workingHourFrom: 8,
                    workingHourTo: 16,
                    wagons: []
                });
            }
        });
        
        it('Should return 404 on non existing coaster / update', async() => {
            const data : Partial<Coaster> = {
                id: 'ae89ede9-5a68-42c9-a2af-95f9e34db939', // should be ignored
                name: 'A2',
                personelNumber: 20,
                customerNumber: 60001,
                routeLength: 2000, // should be ignored
                workingHourFrom: 9,
                workingHourTo: 17,
            };
            
            const response = await client.put(`coasters/ae89ede9-5a68-42c9-a2af-95f9e34db939`, data);
            
            expect(response.status).to.be.eq(404);
            expect(response.data).to.containSubset({
                code: 1728135683166,
                message: 'Coaster not found',
                result: 'Error',
            });
        });
        
        it('Should be able to create wagon', async() => {
            const data : Partial<Wagon> = {
                seatNumber: 20,
                speed: 1.5,
            };
            
            const response = await client.post(`coasters/${coasterId}/wagons`, data);
            
            expect(response.status).to.be.eq(200);
            expect(response.data).to.containSubset({
                '@type': 'Wagon',
                seatNumber: 20,
                speed: 1.5,
            });
        });
        
        it('Should return 404 on non existing coaster / create wagon', async() => {
            const data : Partial<Wagon> = {
                seatNumber: 20,
                speed: 1.5,
            };
            
            const response = await client.post(`coasters/ae89ede9-5a68-42c9-a2af-95f9e34db939/wagons`, data);
            
            expect(response.status).to.be.eq(404);
            expect(response.data).to.containSubset({
                code: 1728128585924,
                message: 'Coaster not found',
                result: 'Error',
            });
        });
        
        describe('With wagon created', () => {
            let wagonId : string;
            
            beforeEach(async() => {
                const data : Partial<Wagon> = {
                    seatNumber: 20,
                    speed: 1.5,
                };
                
                const response = await client.post(`coasters/${coasterId}/wagons`, data);
                wagonId = response.data.id;
            });
            
            it('Should be able to delete wagon', async() => {
                const response = await client.delete(`coasters/${coasterId}/wagons/${wagonId}`);
                
                expect(response.status).to.be.eq(200);
                
                const getResponse = await client.get(`coasters/${coasterId}`);
                expect(getResponse.status).to.be.eq(200);
                expect(getResponse.data.wagons).to.be.empty;
            });
            
            it('Should return 404 on non existing coaster / delete wagon', async() => {
                const response = await client.delete(`coasters/ae89ede9-5a68-42c9-a2af-95f9e34db939/wagons/${wagonId}`);
                
                expect(response.status).to.be.eq(404);
                expect(response.data).to.containSubset({
                    code: 1728196609984,
                    message: 'Coaster not found',
                    result: 'Error',
                });
            });
            
            it('Should return 404 on non existing wagon / delete wagon', async() => {
                const response = await client.delete(`coasters/${coasterId}/wagons/ae89ede9-5a68-42c9-a2af-95f9e34db939`);
                
                expect(response.status).to.be.eq(404);
                expect(response.data).to.containSubset({
                    code: 1728134626069,
                    message: 'Wagon not found',
                    result: 'Error',
                });
            });
        });
    });
});
