import { StorageProvider } from './storage-provider.interface';

export class InMemoryStorage implements StorageProvider {

    private static storage = new Map<string, Map<string, Map<string, any>>>();

    private static getStore(database: string, store: string): Map<string, any> {
        if (!this.storage.has(database)) this.storage.set(database, new Map());
        const db = this.storage.get(database)!;
        if (!db.has(store)) db.set(store, new Map());
        return db.get(store)!;
    }

    public static async get<T = any>(database: string, store: string, key: string): Promise<T | null> {
        return this.getStore(database, store).get(key) ?? null;
    }

    public static async set(database: string, store: string, key: string, value: any): Promise<void> {
        this.getStore(database, store).set(key, value);
    }

    public static async delete(database: string, store: string, key: string): Promise<void> {
        this.getStore(database, store).delete(key);
    }

    public static async clear(database: string, store: string): Promise<void> {
        this.getStore(database, store).clear();
    }

    public static async keys(database: string, store: string): Promise<string[]> {
        return [...this.getStore(database, store).keys()];
    }

    public static async getAll<T = any>(database: string, store: string): Promise<T[]> {
        return [...this.getStore(database, store).values()];
    }

    async get<T = any>(database: string, store: string, key: string): Promise<T | null> { return InMemoryStorage.get<T>(database, store, key); }
    async set(database: string, store: string, key: string, value: any): Promise<void> { return InMemoryStorage.set(database, store, key, value); }
    async delete(database: string, store: string, key: string): Promise<void> { return InMemoryStorage.delete(database, store, key); }
    async clear(database: string, store: string): Promise<void> { return InMemoryStorage.clear(database, store); }
    async keys(database: string, store: string): Promise<string[]> { return InMemoryStorage.keys(database, store); }
    async getAll<T = any>(database: string, store: string): Promise<T[]> { return InMemoryStorage.getAll<T>(database, store); }

}
