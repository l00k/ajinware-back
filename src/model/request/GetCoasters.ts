import type { Coaster } from '$/model/Coaster.js';
import { ListParams } from '$/model/db/ListParams.js';
import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';
import { BaseRequest } from './BaseRequest.js';

@Srlz.Type()
export class GetCoasters extends BaseRequest
{
    
    @Srlz.Expose()
    @Srlz.Type(() => ListParams)
    @Validate.ValidateNested()
    @Validate.IsOptional()
    declare public query : ListParams<Coaster>;
    
}
