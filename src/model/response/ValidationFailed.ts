import { Srlz } from 'serialzr';
import { BaseResponse } from './BaseResponse.js';

@Srlz.Type()
export class ValidationFailed extends BaseResponse<ValidationFailed>
{
    
    @Srlz.Expose()
    public status : number = 422;
    
    @Srlz.Expose({ deeply: true })
    @Srlz.Type({ arrayOf: () => Object })
    declare public body : any[];
    
}
