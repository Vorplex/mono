export type StorageDefinition = { [database: string]: { [store: string]: any } };

export interface StorageProvider<T extends StorageDefinition = StorageDefinition> {
    get<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore, key: string): Promise<T[TDatabase][TStore] | null>;
    set<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore, key: string, value: T[TDatabase][TStore]): Promise<void>;
    delete<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore, key: string): Promise<void>;
    clear<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore): Promise<void>;
    keys<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore): Promise<string[]>;
    getAll<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore): Promise<T[TDatabase][TStore][]>;
}
