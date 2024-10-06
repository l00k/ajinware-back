import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';


@Srlz.Type()
export class Pagination
{
    
    @Srlz.Expose()
    @Srlz.Type(() => Number)
    @Validate.IsOptional()
    @Validate.IsNumber()
    @Validate.Min(0)
    public offset? : number;
    
    @Srlz.Expose()
    @Srlz.Type(() => Number)
    @Validate.IsOptional()
    @Validate.IsNumber()
    @Validate.Min(0)
    public limit? : number;
    
}
