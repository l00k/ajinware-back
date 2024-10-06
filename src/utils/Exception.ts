export class Exception extends Error
{
    
    public name : string = 'Exception';
    public code : number;
    
    public constructor (
        message : string,
        code : number = -1,
        error ? : Error
    )
    {
        super(message);
        this.code = code;
        
        if (error) {
            this._initErrorMessage(this.message, error);
        }
    }
    
    public toString ()
    {
        return this.name + ': ' + this.message;
    }
    
    protected _initErrorMessage (message, error)
    {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - it depends on the environment
        const captureStackTrace : AnyFn = Error.captureStackTrace;
        if (typeof captureStackTrace === 'function') {
            captureStackTrace(this, this.constructor);
        }
        else {
            this.stack = (new Error(message)).stack;
        }
        
        const messageLines = (this.message.match(/\n/g) || []).length + 1;
        this.stack = this.constructor.name + ': [' + this.code + '] ' + message + '\n' +
            this.stack.split('\n').slice(1, messageLines + 1).join('\n')
            + '\n'
            + error.stack;
    }
    
}
