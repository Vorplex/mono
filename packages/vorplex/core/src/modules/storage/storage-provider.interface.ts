export interface StorageProvider<TDatabase extends string = string, TStore extends string = string> {
    get<T = any>(database: TDatabase, store: TStore, key: string): Promise<T | null>;
    set(database: TDatabase, store: TStore, key: string, value: any): Promise<void>;
    delete(database: TDatabase, store: TStore, key: string): Promise<void>;
    clear(database: TDatabase, store: TStore): Promise<void>;
    keys(database: TDatabase, store: TStore): Promise<string[]>;
    getAll<T = any>(database: TDatabase, store: TStore): Promise<T[]>;
}
