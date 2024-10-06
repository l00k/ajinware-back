import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';
import { BaseRequest } from './BaseRequest.js';


@Srlz.Type()
export class DeleteWagonParams
{
    
    @Srlz.Expose()
    @Validate.IsString()
    @Validate.IsUUID(4)
    public coasterId : string;
    
    @Srlz.Expose()
    @Validate.IsString()
    @Validate.IsUUID(4)
    public wagonId : string;
    
}


@Srlz.Type()
export class DeleteWagon extends BaseRequest
{
    
    @Srlz.Expose()
    @Srlz.Type(() => DeleteWagonParams)
    @Validate.ValidateNested()
    declare public params : DeleteWagonParams;
    
}
