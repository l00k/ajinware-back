export enum LogLevel
{
    Debug = 1,
    Log,
    Info,
    Warn,
    Error,
    None
}

export const LogLevels = [
    LogLevel.Debug,
    LogLevel.Log,
    LogLevel.Info,
    LogLevel.Warn,
    LogLevel.Error,
];

export const LogLevelNames = {
    [LogLevel.Debug]: 'debug',
    [LogLevel.Log]: 'log',
    [LogLevel.Info]: 'info',
    [LogLevel.Warn]: 'warn',
    [LogLevel.Error]: 'error',
};

export const LogLevelColor = {
    [LogLevel.Debug]: 'gray',
    [LogLevel.Log]: 'white',
    [LogLevel.Info]: 'green',
    [LogLevel.Warn]: 'yellow',
    [LogLevel.Error]: 'red',
};

export type LoggerConfig = {
    logLevel : LogLevel,
    storagePath : string,
};
