import { BaseResponse } from '$/model/response/index.js';

export abstract class AbstractController
{
    
    protected _prepareNotFoundResponse (
        message : string = 'Not found',
        code : number = 0
    ) : BaseResponse
    {
        return new BaseResponse({
            status: 404,
            body: {
                result: 'Error',
                message,
                code,
            }
        });
    }
    
}
