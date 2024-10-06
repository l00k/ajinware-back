import type { ExposeGroup } from '$/model/ExposeGroup.js';
import type express from 'express';
import type { TypeModifiers } from 'serialzr';

export type ClassConstructor<T = any> = {
    new (...args : any[]) : T;
};

export type ApiConfig = {
    port : number,
    basePath : string,
}

export type ApiContext = {
    request : express.Request,
    response : express.Response,
}

export type ExposeGroups = {
    request? : ExposeGroup[],
    response? : ExposeGroup[],
}

export enum ActionMethod
{
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

export type ActionOptions = TypeModifiers & {
    groups? : ExposeGroups,
}

export type ActionDefinition = {
    propertyKey : PropertyKey,
    
    method : ActionMethod,
    route : string,
    requestFn : () => ClassConstructor,
    
    options : ActionOptions,
}
