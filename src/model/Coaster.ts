import { ExposeGroup } from '$/model/ExposeGroup.js';
import { Wagon } from '$/model/Wagon.js';
import { AbstractModel } from '$/service/db/AbstractModel.js';
import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';


@Srlz.Type('Coaster')
export class Coaster extends AbstractModel
{
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsString()
    @Validate.MinLength(1)
    public name : string;
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsInt()
    @Validate.Min(0)
    public personelNumber : number;
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsInt()
    @Validate.Min(0)
    public customerNumber : number;
    
    @Srlz.Exclude([
        ExposeGroup.Update
    ])
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsInt()
    @Validate.Min(0)
    public routeLength : number;
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsNumber()
    @Validate.Min(0)
    @Validate.Max(24)
    public workingHourFrom : number;
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsNumber()
    @Validate.Min(0)
    @Validate.Max(24)
    public workingHourTo : number;
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiOut,
    ])
    @Srlz.Type({ arrayOf: () => Wagon })
    @Validate.ValidateNested({ each: true })
    public wagons : Wagon[] = [];
    
    
    public constructor (params : Partial<Coaster> = {})
    {
        super();
        Object.assign(this, params);
    }
    
    
    public getWorkingHourFromFormat () : string
    {
        const minutes = (this.workingHourFrom % 1) * 60;
        return this.workingHourFrom.toString().padStart(2, '0')
            + ':'
            + minutes.toString().padStart(2, '0')
            ;
    }
    
    public getWorkingHourToFormat () : string
    {
        const minutes = (this.workingHourTo % 1) * 60;
        return this.workingHourTo.toString().padStart(2, '0')
            + ':'
            + minutes.toString().padStart(2, '0')
            ;
    }
    
    public getActiveWagonsNumber () : number
    {
        return Math.min(
            Math.floor((this.personelNumber - 1) / 2),
            this.wagons.length
        );
    }
    
    public getRequiredPersonelNumber () : number
    {
        return 1
            + (this.wagons.length * 2)
            ;
    }
    
    public getWorkingTimeS () : number
    {
        return (this.workingHourTo - this.workingHourFrom) * 3600;
    }
    
    public getCustomersCapacity () : number
    {
        let totalCapacity : number = 0;
        
        const workingTimeS = this.getWorkingTimeS();
        
        for (const wagon of this.wagons) {
            const singleCourseTimeS = this.routeLength / wagon.speed // route time
                + 300 // 5 minutes rest
            ;
            const maxCourses = Math.floor(workingTimeS / singleCourseTimeS);
            totalCapacity += wagon.seatNumber * maxCourses;
        }
        
        return Math.floor(totalCapacity);
    }
    
    public getMissingWagons () : number
    {
        const currentCapacity = this.getCustomersCapacity();
        const delta = this.customerNumber - currentCapacity;
        if (delta > 0) {
            const sampleWagon = this.wagons[0];
            if (!sampleWagon) {
                return 0;
            }
            
            const singleCourseTimeS = this.routeLength / sampleWagon.speed // route time
                + 300 // 5 minutes rest
            ;
            const maxCourses = this.getWorkingTimeS() / singleCourseTimeS;
            return Math.ceil(delta / (sampleWagon.seatNumber * maxCourses));
        }
        
        return 0;
    }
    
    public getExcessWagons () : number
    {
        let currentCapacity : number = 0;
        
        const workingTimeS = this.getWorkingTimeS();
        
        let i : number = 0;
        for (; i < this.wagons.length; ++i) {
            if (currentCapacity >= this.customerNumber) {
                break;
            }
            
            const wagon = this.wagons[i];
            
            const singleCourseTimeS = this.routeLength / wagon.speed // route time
                + 300 // 5 minutes rest
            ;
            const maxCourses = workingTimeS / singleCourseTimeS;
            currentCapacity += wagon.seatNumber * maxCourses;
        }
        
        return this.wagons.length - i;
    }
    
}
