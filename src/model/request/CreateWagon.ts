import { Wagon } from '$/model/Wagon.js';
import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';
import { BaseRequest } from './BaseRequest.js';

@Srlz.Type()
export class CreateWagon extends BaseRequest
{
    
    @Srlz.Expose()
    @Srlz.Type(() => Wagon)
    @Validate.ValidateNested()
    declare public body : Wagon;
    
}
