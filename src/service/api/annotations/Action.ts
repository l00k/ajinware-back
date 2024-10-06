import type { ExposeGroup } from '$/model/ExposeGroup.js';
import { BaseRequest } from '$/model/request/BaseRequest.js';
import { BaseResponse } from '$/model/response/BaseResponse.js';
import type { ActionOptions , ActionDefinition, ActionMethod, ExposeGroups } from '../def.js';
import { MetadataStorage } from '../MetadataStorage.js';


export function Action<
    REQ extends typeof BaseRequest
> (
    method : ActionMethod,
    route : string,
    requestFn : () => REQ,
    options : ActionOptions = {}
) : PropertyDecorator
{
    if (!requestFn) {
        requestFn = () => <any>BaseRequest;
    }
    
    return (target : any, propertyKey : PropertyKey) => {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        const definition : Partial<ActionDefinition> = {
            propertyKey,
            method,
            route,
            requestFn,
            options
        };
        
        MetadataStorage.getSingleton()
            .registerAction(
                constructor,
                propertyKey,
                definition
            );
    };
}


function ActionGroups (groups : ExposeGroups) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey) => {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        MetadataStorage.getSingleton()
            .registerAction(
                constructor,
                propertyKey,
                { options: { groups } }
            );
    };
};

Action.Groups = ActionGroups;

ActionGroups.Request = function(groups : ExposeGroup[]) : PropertyDecorator {
    return (target : any, propertyKey : PropertyKey) => {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        MetadataStorage.getSingleton()
            .registerAction(
                constructor,
                propertyKey,
                { options: { groups: { request: groups } } }
            );
    };
};

ActionGroups.Response = function(groups : ExposeGroup[]) : PropertyDecorator {
    return (target : any, propertyKey : PropertyKey) => {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        MetadataStorage.getSingleton()
            .registerAction(
                constructor,
                propertyKey,
                { options: { groups: { response: groups } } }
            );
    };
};
