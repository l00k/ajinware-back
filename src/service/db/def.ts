import type { AbstractModel } from './AbstractModel.js';

export type ClassConstructor<T extends AbstractModel = any> = new (...args : any[]) => T;

export type DbConfig = {
    storagePath : string,
    models : () => ClassConstructor[],
};

export type Schema = Map<any, string>;

export type DbRecordId = number | string;

export type DbTable = AbstractModel[];
export type DbData = Record<string, DbTable>;

export enum OperationId
{
    Save = 'save',
    Delete = 'delete',
    DeleteById = 'deleteById',
}

export type Operation = {
    id : OperationId.Save,
    model : ClassConstructor,
    record : AbstractModel,
} | {
    id : OperationId.Delete,
    model : ClassConstructor,
    record : AbstractModel,
} | {
    id : OperationId.DeleteById,
    model : ClassConstructor,
    recordId : DbRecordId,
};

export type ClusterOperation = {
    operation : Operation,
    peerId : string,
}
