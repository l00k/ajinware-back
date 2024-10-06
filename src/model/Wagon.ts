import { AbstractModel } from '$/service/db/AbstractModel.js';
import { ExposeGroup } from '$/model/ExposeGroup.js';
import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';


@Srlz.Type('Wagon')
export class Wagon extends AbstractModel
{
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsInt()
    @Validate.Min(0)
    public seatNumber : number;
    
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.Sync,
        ExposeGroup.ApiIn,
        ExposeGroup.ApiOut,
    ])
    @Validate.IsNumber()
    @Validate.Min(0)
    public speed : number;
    
    
    public constructor (params : Partial<Wagon> = {})
    {
        super();
        Object.assign(this, params);
    }
    
}
