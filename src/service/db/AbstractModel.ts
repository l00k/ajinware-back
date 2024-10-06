import { ExposeGroup } from '$/model/ExposeGroup.js';
import { Srlz } from 'serialzr';
import { v4 as uuid } from 'uuid';


export abstract class AbstractModel
{
    
    @Srlz.Exclude([
        ExposeGroup.Update
    ])
    @Srlz.Expose([
        ExposeGroup.Storage,
        ExposeGroup.ApiOut,
    ])
    @Srlz.Id()
    public id : string = uuid();
    
}
