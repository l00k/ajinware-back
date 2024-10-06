import { Coaster } from '$/model/Coaster.js';
import { BaseResponse } from '$/model/response/BaseResponse.js';
import { Srlz } from 'serialzr';

@Srlz.Type()
export class GetCoasters extends BaseResponse<GetCoasters>
{
    
    @Srlz.Expose()
    @Srlz.Type({ arrayOf: () => Coaster })
    declare public body : Coaster[];
    
}
