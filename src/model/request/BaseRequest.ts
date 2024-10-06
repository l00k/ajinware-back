import { Srlz } from 'serialzr';

@Srlz.Type()
export class BaseRequest
{
    
    @Srlz.Expose({ deeply: true })
    public body : any;
    
    @Srlz.Expose({ deeply: true })
    public params : any;
    
    @Srlz.Expose({ deeply: true })
    public query : any;
    
}
