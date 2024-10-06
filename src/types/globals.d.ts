// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type AnyFn<T = void> = (...args : any[]) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type AsyncAnyFn<T = void> = (...args : any[]) => Promise<T>;

declare type PartRecord<T extends string | number, U> = Partial<Record<T, U>>;

declare type RecursivePartial<T> = T extends object
    ? { [P in keyof T]? : RecursivePartial<T[P]> }
    : T
    ;
