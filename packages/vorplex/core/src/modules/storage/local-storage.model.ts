import { StorageProvider } from './storage-provider.interface';

export class LocalStorage implements StorageProvider {

    private static key(database: string, store: string, key?: string): string {
        return `${database}:${store}:${key ?? ''}`;
    }

    public static async get<T = any>(database: string, store: string, key: string): Promise<T | null> {
        const raw = localStorage.getItem(this.key(database, store, key));
        return raw != null ? JSON.parse(raw) : null;
    }

    public static async set(database: string, store: string, key: string, value: any): Promise<void> {
        localStorage.setItem(this.key(database, store, key), JSON.stringify(value));
    }

    public static async delete(database: string, store: string, key: string): Promise<void> {
        localStorage.removeItem(this.key(database, store, key));
    }

    public static async clear(database: string, store: string): Promise<void> {
        const prefix = this.key(database, store);
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) localStorage.removeItem(key);
        }
    }

    public static async keys(database: string, store: string): Promise<string[]> {
        const prefix = this.key(database, store);
        const result: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) result.push(key.slice(prefix.length));
        }
        return result;
    }

    public static async getAll<T = any>(database: string, store: string): Promise<T[]> {
        const prefix = this.key(database, store);
        const result: T[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) result.push(JSON.parse(localStorage.getItem(key)!));
        }
        return result;
    }

    async get<T = any>(database: string, store: string, key: string): Promise<T | null> { return LocalStorage.get<T>(database, store, key); }
    async set(database: string, store: string, key: string, value: any): Promise<void> { return LocalStorage.set(database, store, key, value); }
    async delete(database: string, store: string, key: string): Promise<void> { return LocalStorage.delete(database, store, key); }
    async clear(database: string, store: string): Promise<void> { return LocalStorage.clear(database, store); }
    async keys(database: string, store: string): Promise<string[]> { return LocalStorage.keys(database, store); }
    async getAll<T = any>(database: string, store: string): Promise<T[]> { return LocalStorage.getAll<T>(database, store); }

}
