export class IndexedDB {
    public static async getDatabaseInfo(name: string): Promise<IDBDatabaseInfo | undefined> {
        const databases = await indexedDB.databases();
        return databases.find((database) => database.name === name);
    }

    public static async openDatabase(name: string, version?: number): Promise<IDBDatabase & Disposable> {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(name, version);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event: any) => reject(event.target.error);
        });
        return Object.assign(db, {
            [Symbol.dispose]() {
                db.close();
            },
        });
    }

    public static async getDatabaseStores(name: string): Promise<string[]> {
        using database = await IndexedDB.openDatabase(name);
        return Array.from(database.objectStoreNames);
    }

    public static async createDatabaseStore(databaseName: string, storeName: string): Promise<void> {
        const existingStores = await IndexedDB.getDatabaseStores(databaseName);
        if (existingStores.find((store) => store === storeName)) return;
        const databaseInfo = await IndexedDB.getDatabaseInfo(databaseName);
        const currentVersion = databaseInfo?.version || 1;

        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(databaseName, currentVersion + 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };
            request.onsuccess = () => {
                request.result.close();
                resolve();
            };
            request.onerror = (event: any) => reject(event.target.error);
        });
    }

    public static async openStore(databaseName: string, storeName: string, mode: IDBTransactionMode = 'readwrite'): Promise<IDBObjectStore & Disposable> {
        await IndexedDB.createDatabaseStore(databaseName, storeName);
        const db = await IndexedDB.openDatabase(databaseName);
        const transaction = db.transaction(storeName, mode);
        const objectStore = transaction.objectStore(storeName);
        return Object.assign(objectStore, {
            [Symbol.dispose]() {
                db.close();
            },
        });
    }

    public static async set(databaseName: string, storeName: string, key: string, value: any): Promise<void> {
        using store = await IndexedDB.openStore(databaseName, storeName);
        const request = store.put(value, key);
        return new Promise<void>((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = (event: any) => reject(event.target.error);
        });
    }

    public static async get<T = any>(databaseName: string, storeName: string, key: IDBValidKey | IDBKeyRange): Promise<T | null> {
        using store = await IndexedDB.openStore(databaseName, storeName, 'readonly');
        const request = store.get(key);
        return new Promise<T | null>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = (event: any) => reject(event.target.error);
        });
    }

    public static async getAllKeys(databaseName: string, storeName: string): Promise<string[] | null> {
        using store = await IndexedDB.openStore(databaseName, storeName, 'readonly');
        const request = store.getAllKeys();
        return new Promise<string[] | null>((resolve, reject) => {
            request.onsuccess = () => resolve((request.result as string[]) ?? null);
            request.onerror = (event: any) => reject(event.target.error);
        });
    }

    public static async getAll<T = any>(databaseName: string, storeName: string, key?: IDBValidKey | IDBKeyRange): Promise<T[] | null> {
        using store = await IndexedDB.openStore(databaseName, storeName, 'readonly');
        const request = store.getAll(key);
        return new Promise<T[] | null>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = (event: any) => reject(event.target.error);
        });
    }

    public static async clear(databaseName: string, storeName: string): Promise<void> {
        using store = await IndexedDB.openStore(databaseName, storeName);
        return new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (event: any) => reject(event.target.error);
        });
    }
}
