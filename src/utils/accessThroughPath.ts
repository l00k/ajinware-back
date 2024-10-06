import { Exception } from './Exception.js';

type Options = {
    throwOnFailure : boolean,
    autoCreate : boolean,
};

export function accessThroughPath (
    obj : any,
    path : string,
    options : Partial<Options> = {}
)
{
    options = {
        throwOnFailure: false,
        autoCreate: false,
        ...options,
    };
    
    const parts = path.split('.');
    
    const currentPath = [];
    let part = null;
    
    while ((part = parts.shift())) {
        currentPath.push(part);
        
        const isLeaf = !parts.length;
        
        if (obj[part] === undefined) {
            if (isLeaf) {
                return undefined;
            }
            else if (options.autoCreate) {
                obj[part] = {};
            }
            else if (options.throwOnFailure) {
                const fullPath = currentPath.join('.');
                throw new Exception(`Undefined node at ${fullPath}`, 1727948848029);
            }
            else {
                return undefined;
            }
        }
        
        obj = obj[part];
    }
    
    return obj;
}
