import * as Validate from 'class-validator';
import { Srlz } from 'serialzr';
import type { Filters } from './Filters.js';
import { Order } from './Order.js';
import { Pagination } from './Pagination.js';


@Srlz.Type()
export class ListParams<T>
{
    
    @Srlz.Expose({ deeply: true })
    @Validate.IsOptional()
    @Validate.IsObject()
    public filters : Filters<T>;
    
    @Srlz.Expose()
    @Srlz.Type({ arrayOf: () => Order })
    @Validate.ValidateNested({ each: true })
    @Validate.IsOptional()
    public order : Order[];
    
    @Srlz.Expose()
    @Srlz.Type(() => Pagination)
    @Validate.ValidateNested({ each: true })
    @Validate.IsOptional()
    public pagination : Pagination = new Pagination();
    
    
    public constructor (data : Partial<ListParams<T>> = {})
    {
        Object.assign(this, data);
    }
    
}
