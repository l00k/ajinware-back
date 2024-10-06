import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';
import { BaseRequest } from './BaseRequest.js';


@Srlz.Type()
export class GetCoasterParams
{
    
    @Srlz.Expose()
    @Validate.IsString()
    @Validate.IsUUID(4)
    public coasterId : string;
    
}


@Srlz.Type()
export class GetCoaster extends BaseRequest
{
    
    @Srlz.Expose()
    @Srlz.Type(() => GetCoasterParams)
    @Validate.ValidateNested()
    declare public params : GetCoasterParams;
    
}
