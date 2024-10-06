import { Srlz } from 'serialzr';

@Srlz.Type()
export class BaseResponse<T extends BaseResponse = any>
{
    
    @Srlz.Expose()
    public status : number = 200;
    
    @Srlz.Expose({ deeply: true })
    public body : any = { result: 'OK' };
    
    public constructor (data : Partial<T> = {})
    {
        Object.assign(this, data);
    }
    
}
