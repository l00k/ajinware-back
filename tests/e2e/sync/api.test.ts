import type { Coaster } from '$/model/Coaster.js';
import { ApiService } from '$/service/api/index.js';
import { sleep } from '$/utils/sleep.js';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import qs from 'qs';


describe('Sync', () => {
    let api : ApiService;
    
    const masterNode : AxiosInstance = axios.create({
        baseURL: 'http://localhost:3150/api',
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'brackets' }),
        validateStatus: () => true,
    });
    
    const slaveNode1 : AxiosInstance = axios.create({
        baseURL: 'http://localhost:3250/api',
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'brackets' }),
        validateStatus: () => true,
    });
    
    const slaveNode2 : AxiosInstance = axios.create({
        baseURL: 'http://localhost:3350/api',
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'brackets' }),
        validateStatus: () => true,
    });
    
    
    function assertAndReadDb (
        node : number,
        modelName : string
    )
    {
        const tableFilePath = path.join(`docker/test/.storage${node}/db/test/${modelName}.json`);
        expect(fs.existsSync(tableFilePath)).to.be.true;
        
        const tableContent = fs.readFileSync(tableFilePath, { encoding: 'utf8' });
        return JSON.parse(tableContent);
    }
    
    
    it('Should be able to create coaster via master node', async() => {
        const data : Partial<Coaster> = {
            name: 'A1',
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
        };
        
        const response = await masterNode.post('coasters', data);
        
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
    
    it('Should be able to create coaster via slave node', async() => {
        const data : Partial<Coaster> = {
            name: 'A1',
            personelNumber: 16,
            customerNumber: 60000,
            routeLength: 1800,
            workingHourFrom: 8,
            workingHourTo: 16,
        };
        
        const response = await slaveNode1.post('coasters', data);
        
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
    
    describe('with Coaster created via master node', () => {
        let coasterId : string;
        
        beforeEach(async() => {
            const data : Partial<Coaster> = {
                name: 'B1',
                personelNumber: 12,
                customerNumber: 30000,
                routeLength: 900,
                workingHourFrom: 4,
                workingHourTo: 8,
            };
            
            const response = await masterNode.post('coasters', data);
            coasterId = response.data.id;
            
            // give it time to spread
            await sleep(250);
        });
        
        it('Should be able to access created Coaster via slave node', async() => {
            const response = await slaveNode1.get(`coasters/${coasterId}`);
            
            expect(response.status).to.be.eq(200);
            expect(response.data).to.containSubset({
                '@type': 'Coaster',
                id: coasterId,
                name: 'B1',
                personelNumber: 12,
                customerNumber: 30000,
                routeLength: 900,
                workingHourFrom: 4,
                workingHourTo: 8,
                wagons: []
            });
        });
    });
    
    describe('with Coaster created via slave node', () => {
        let coasterId : string;
        
        beforeEach(async() => {
            const data : Partial<Coaster> = {
                name: 'C1',
                personelNumber: 12,
                customerNumber: 30000,
                routeLength: 900,
                workingHourFrom: 4,
                workingHourTo: 8,
            };
            
            const response = await slaveNode1.post('coasters', data);
            coasterId = response.data.id;
            
            // give it time to spread
            await sleep(250);
        });
        
        it('Should be able to access created Coaster via master node', async() => {
            const response = await masterNode.get(`coasters/${coasterId}`);
            
            expect(response.status).to.be.eq(200);
            expect(response.data).to.containSubset({
                '@type': 'Coaster',
                id: coasterId,
                name: 'C1',
                personelNumber: 12,
                customerNumber: 30000,
                routeLength: 900,
                workingHourFrom: 4,
                workingHourTo: 8,
                wagons: []
            });
        });
        
        it('Should be able to access created Coaster via other slave node', async() => {
            const response = await slaveNode2.get(`coasters/${coasterId}`);
            
            expect(response.status).to.be.eq(200);
            expect(response.data).to.containSubset({
                '@type': 'Coaster',
                id: coasterId,
                name: 'C1',
                personelNumber: 12,
                customerNumber: 30000,
                routeLength: 900,
                workingHourFrom: 4,
                workingHourTo: 8,
                wagons: []
            });
        });
    });
    
});
