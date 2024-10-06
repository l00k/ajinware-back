import { Coaster } from '$/model/Coaster.js';
import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';
import { BaseRequest } from './BaseRequest.js';


@Srlz.Type()
export class UpdateCoasterParams
{
    
    @Srlz.Expose()
    @Validate.IsString()
    @Validate.IsUUID(4)
    public coasterId : string;
    
}

@Srlz.Type()
export class UpdateCoaster extends BaseRequest
{
    
    @Srlz.Expose()
    @Srlz.Type(() => Coaster)
    // no validation here - manually validate in the controller
    declare public body : Coaster;
    
    @Srlz.Expose()
    @Srlz.Type(() => UpdateCoasterParams)
    @Validate.ValidateNested()
    declare public params : UpdateCoasterParams;
    
}
