import { BaseResponse } from '$/model/response/BaseResponse.js';
import { Wagon } from '$/model/Wagon.js';
import { Srlz } from 'serialzr';

@Srlz.Type()
export class GetWagon extends BaseResponse<GetWagon>
{
    
    @Srlz.Expose()
    @Srlz.Type(() => Wagon)
    declare public body : Wagon;
    
}
