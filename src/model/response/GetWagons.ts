import { BaseResponse } from '$/model/response/BaseResponse.js';
import { Wagon } from '$/model/Wagon.js';
import { Srlz } from 'serialzr';

@Srlz.Type()
export class GetWagons extends BaseResponse<GetWagons>
{
    
    @Srlz.Expose()
    @Srlz.Type({ arrayOf: () => Wagon })
    declare public body : Wagon[];
    
}
