import { StorageProvider } from '@vorplex/core';

export class IndexedDbStorage implements StorageProvider {

    private static promisify<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event: any) => reject(event.target.error);
        });
    }

    private static async connect<T>(databaseName: string, storeName: string, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
        let database: IDBDatabase = await this.promisify(indexedDB.open(databaseName));

        if (!database.objectStoreNames.contains(storeName)) {
            const version = database.version;
            database.close();
            database = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open(databaseName, version + 1);
                request.onupgradeneeded = () => request.result.createObjectStore(storeName);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event: any) => reject(event.target.error);
            });
        }

        try {
            const store = database.transaction(storeName, mode).objectStore(storeName);
            return await this.promisify(callback(store));
        } finally {
            database.close();
        }
    }

    public static async get<T = any>(database: string, store: string, key: string): Promise<T | null> {
        const result = await this.connect(database, store, 'readonly', (store) => store.get(key));
        return result ?? null;
    }

    public static async set(database: string, store: string, key: string, value: any): Promise<void> {
        await this.connect(database, store, 'readwrite', (store) => store.put(value, key));
    }

    public static async delete(database: string, store: string, key: string): Promise<void> {
        await this.connect(database, store, 'readwrite', (store) => store.delete(key));
    }

    public static async clear(database: string, store: string): Promise<void> {
        await this.connect(database, store, 'readwrite', (store) => store.clear());
    }

    public static async keys(database: string, store: string): Promise<string[]> {
        return await this.connect(database, store, 'readonly', (store) => store.getAllKeys()) as string[];
    }

    public static async getAll<T = any>(database: string, store: string): Promise<T[]> {
        return await this.connect(database, store, 'readonly', (store) => store.getAll()) ?? [];
    }

    async get<T = any>(database: string, store: string, key: string): Promise<T | null> { return IndexedDbStorage.get<T>(database, store, key); }
    async set(database: string, store: string, key: string, value: any): Promise<void> { return IndexedDbStorage.set(database, store, key, value); }
    async delete(database: string, store: string, key: string): Promise<void> { return IndexedDbStorage.delete(database, store, key); }
    async clear(database: string, store: string): Promise<void> { return IndexedDbStorage.clear(database, store); }
    async keys(database: string, store: string): Promise<string[]> { return IndexedDbStorage.keys(database, store); }
    async getAll<T = any>(database: string, store: string): Promise<T[]> { return IndexedDbStorage.getAll<T>(database, store); }

}
