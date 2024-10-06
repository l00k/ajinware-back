import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';

export enum OrderDir
{
    ASC = 'ASC',
    DESC = 'DESC',
}

@Srlz.Type()
export class Order
{
    
    @Srlz.Expose()
    @Validate.IsString()
    public field : string;
    
    @Srlz.Expose()
    @Validate.IsEnum(OrderDir)
    public dir : OrderDir;
    
}
