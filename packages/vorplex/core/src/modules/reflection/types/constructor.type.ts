export type Constructor<TType = any, TParams extends any[] = any[]> = new (...args: TParams) => TType;
export type AbstractConstructor<TType = any, TParams extends any[] = any[]> = abstract new (...args: TParams) => TType;
