import { Coaster } from '$/model/Coaster.js';
import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';
import { BaseRequest } from './BaseRequest.js';

@Srlz.Type()
export class CreateCoasters extends BaseRequest
{
    
    @Srlz.Expose()
    @Srlz.Type(() => Coaster)
    @Validate.ValidateNested()
    declare public body : Coaster;
    
}
