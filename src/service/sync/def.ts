export type SyncConfig = {
    url : string,
    peerId : string,
}

export enum NodeMode
{
    Master = 'master',
    Slave = 'slave',
}

export type Message<T = any> = {
    type : string,
    origin : string,
    originProxied? : string,
    resource : T,
}

export type MessageHandler = (message : Message) => Promise<void>;
