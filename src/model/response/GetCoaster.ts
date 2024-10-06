import { Coaster } from '$/model/Coaster.js';
import { BaseResponse } from '$/model/response/BaseResponse.js';
import { Srlz } from 'serialzr';

@Srlz.Type()
export class GetCoaster extends BaseResponse<GetCoaster>
{
    
    @Srlz.Expose()
    @Srlz.Type(() => Coaster)
    declare public body : Coaster;
    
}
