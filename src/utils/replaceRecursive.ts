export function replaceRecursive<T> (
    target : Partial<T>,
    source : Partial<T>,
    circularMonit : any[] = []
)
{
    if (circularMonit.includes(target)) {
        return;
    }
    
    circularMonit.push(target);
    
    for (const [ prop, value ] of Object.entries<any>(source)) {
        if (target[prop] instanceof Array) {
            replaceRecursive(target[prop], value, circularMonit);
        }
        else if (target[prop] instanceof Object) {
            replaceRecursive(target[prop], value, circularMonit);
        }
        else {
            target[prop] = value;
        }
    }
}
