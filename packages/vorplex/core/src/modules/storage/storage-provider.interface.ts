export type StorageDefinition = { [database: string]: { [store: string]: any } };

export type StoreKey<T> = string extends keyof T ? string : keyof T & string;
export type StoreValue<T> = T[StoreKey<T>];

export interface StorageProvider<T extends StorageDefinition = StorageDefinition> {
    get<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string, TKey extends StoreKey<T[TDatabase][TStore]>>(database: TDatabase, store: TStore, key: TKey): Promise<T[TDatabase][TStore][TKey] | null>;
    set<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string, TKey extends StoreKey<T[TDatabase][TStore]>>(database: TDatabase, store: TStore, key: TKey, value: T[TDatabase][TStore][TKey]): Promise<void>;
    delete<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string, TKey extends StoreKey<T[TDatabase][TStore]>>(database: TDatabase, store: TStore, key: TKey): Promise<void>;
    clear<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore): Promise<void>;
    keys<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore): Promise<StoreKey<T[TDatabase][TStore]>[]>;
    getAll<TDatabase extends keyof T & string, TStore extends keyof T[TDatabase] & string>(database: TDatabase, store: TStore): Promise<StoreValue<T[TDatabase][TStore]>[]>;
}
