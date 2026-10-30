import { $Path } from '@vorplex/core';

export interface FileSystemPickerType {
    description?: string;
    accept: Record<string, string[]>;
}

export interface FileSystemOpenFileOptions {
    excludeAcceptAllOption?: boolean;
    types?: FileSystemPickerType[];
}

export type FileSystemAccessMode = 'read' | 'readwrite';

export interface FileSystemHandleStore {
    get(key: string): Promise<FileSystemHandle | undefined>;
    set(key: string, handle: FileSystemHandle): Promise<void>;
    delete(key: string): Promise<void>;
}

export interface FileSystemFileInfo {
    path: string;
    size: number;
    lastModified: number;
}

declare global {
    interface Window {
        showDirectoryPicker: (options?: { mode?: FileSystemAccessMode }) => Promise<FileSystemDirectoryHandle>;
        showOpenFilePicker?: (options?: FileSystemOpenFileOptions & { multiple?: boolean }) => Promise<FileSystemFileHandle[]>;
    }

    interface FileSystemHandle {
        queryPermission(descriptor?: { mode?: FileSystemAccessMode }): Promise<PermissionState>;
        requestPermission(descriptor?: { mode?: FileSystemAccessMode }): Promise<PermissionState>;
    }

    interface FileSystemDirectoryHandle {
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    }
}

export class $FileSystem {

    private static readonly handles = new Map<string, FileSystemHandle>();

    private static store: FileSystemHandleStore = {
        get: async key => $FileSystem.handles.get(key),
        set: async (key, handle) => { $FileSystem.handles.set(key, handle); },
        delete: async key => { $FileSystem.handles.delete(key); }
    };

    public static configure(store: FileSystemHandleStore) {
        $FileSystem.handles.clear();
        $FileSystem.store = store;
    }

    public static async pickFolder(): Promise<string> {
        return $FileSystem.addHandle(await window.showDirectoryPicker({ mode: 'readwrite' }));
    }

    public static async pickFile(options?: FileSystemOpenFileOptions): Promise<string> {
        const [handle] = await window.showOpenFilePicker({ ...options, multiple: false });
        return $FileSystem.addHandle(handle);
    }

    public static async pickFiles(options?: FileSystemOpenFileOptions): Promise<string[]> {
        const handles = await window.showOpenFilePicker({ ...options, multiple: true });
        return Promise.all(handles.map(handle => $FileSystem.addHandle(handle)));
    }

    public static async forget(path: string): Promise<void> {
        const key = $Path.absolute(path).split('/')[0];
        $FileSystem.handles.delete(key);
        await $FileSystem.store.delete(key);
    }

    public static async hasAccess(path: string, mode: FileSystemAccessMode = 'readwrite'): Promise<boolean> {
        const root = await $FileSystem.getHandle($Path.absolute(path).split('/')[0]);
        return await root.queryPermission({ mode }) === 'granted';
    }

    public static async requestAccess(path: string, mode: FileSystemAccessMode = 'readwrite'): Promise<boolean> {
        const root = await $FileSystem.getHandle($Path.absolute(path).split('/')[0]);
        if (await root.queryPermission({ mode }) === 'granted') return true;
        return await root.requestPermission({ mode }) === 'granted';
    }

    public static async exists(path: string): Promise<boolean> {
        try {
            const absolute = $Path.absolute(path);
            if (!absolute.includes('/')) {
                await $FileSystem.getHandle(absolute);
                return true;
            }
            const directory = await $FileSystem.getDirectoryHandle($Path.getDirectory(absolute), false);
            const name = $Path.entryName(absolute);
            for await (const [entryName] of directory.entries()) {
                if (entryName === name) return true;
            }
            return false;
        } catch (error) {
            if ($FileSystem.isNotFound(error)) return false;
            throw error;
        }
    }

    public static async createFolder(path: string): Promise<void> {
        await $FileSystem.getDirectoryHandle($Path.absolute(path), true);
    }

    public static async deleteFolder(path: string): Promise<void> {
        const absolute = $Path.absolute(path);
        try {
            const parent = await $FileSystem.getDirectoryHandle($Path.getDirectory(absolute), false);
            await parent.removeEntry($Path.entryName(absolute), { recursive: true });
        } catch (error) {
            if (!$FileSystem.isNotFound(error)) throw error;
        }
    }

    public static async deleteFile(path: string): Promise<void> {
        const absolute = $Path.absolute(path);
        try {
            const parent = await $FileSystem.getDirectoryHandle($Path.getDirectory(absolute), false);
            await parent.removeEntry($Path.entryName(absolute));
        } catch (error) {
            if (!$FileSystem.isNotFound(error)) throw error;
        }
    }

    public static async writeFile(path: string, content: FileSystemWriteChunkType | ReadableStream): Promise<void> {
        const handle = await $FileSystem.getFileHandle($Path.absolute(path), true);
        const writable = await handle.createWritable();
        if (content instanceof ReadableStream) {
            const reader = content.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                await writable.write(value);
            }
            reader.releaseLock();
        } else {
            await writable.write(content);
        }
        await writable.close();
    }

    public static async readFile(path: string): Promise<File> {
        const handle = await $FileSystem.getFileHandle($Path.absolute(path), false);
        return handle.getFile();
    }

    public static async getEntries(path: string): Promise<{ path: string, kind: 'file' | 'directory' }[]> {
        const absolute = $Path.absolute(path);
        const directory = await $FileSystem.getDirectoryHandle(absolute, false);
        const entries: { path: string, kind: 'file' | 'directory' }[] = [];
        for await (const [name, entry] of directory.entries()) {
            entries.push({ path: $Path.join(absolute, name), kind: entry.kind });
        }
        return entries;
    }

    public static async getFiles(path: string): Promise<string[]> {
        return (await $FileSystem.getEntries(path))
            .filter(entry => entry.kind === 'file')
            .map(entry => entry.path);
    }

    public static async getFolders(path: string): Promise<string[]> {
        return (await $FileSystem.getEntries(path))
            .filter(entry => entry.kind === 'directory')
            .map(entry => entry.path);
    }

    public static async getFileInfos(path: string): Promise<FileSystemFileInfo[]> {
        const files: FileSystemFileInfo[] = [];
        const pending = [{ directory: await $FileSystem.getDirectoryHandle($Path.absolute(path), false), prefix: '' }];
        for (let current = pending.pop(); current; current = pending.pop()) {
            for await (const [name, entry] of current.directory.entries()) {
                const entryPath = $Path.join(current.prefix, name);
                if (entry.kind === 'directory') {
                    pending.push({ directory: entry as FileSystemDirectoryHandle, prefix: entryPath });
                    continue;
                }
                const file = await (entry as FileSystemFileHandle).getFile();
                files.push({ path: entryPath, size: file.size, lastModified: file.lastModified });
            }
        }
        return files;
    }

    private static isNotFound(error: unknown): boolean {
        return error instanceof DOMException && error.name === 'NotFoundError';
    }

    private static async addHandle(handle: FileSystemHandle): Promise<string> {
        const key = crypto.randomUUID();
        $FileSystem.handles.set(key, handle);
        await $FileSystem.store.set(key, handle);
        return key;
    }

    private static async getHandle(key: string): Promise<FileSystemHandle> {
        const handle = $FileSystem.handles.get(key) ?? await $FileSystem.store.get(key);
        if (!handle) throw new Error(`Failed to retrieve file system handle for path "${key}"`);
        $FileSystem.handles.set(key, handle);
        return handle;
    }

    private static async getDirectoryHandle(path: string, create: boolean): Promise<FileSystemDirectoryHandle> {
        const [key, ...segments] = path.split('/');
        const root = await $FileSystem.getHandle(key);
        if (root.kind !== 'directory') throw new Error(`Path "${path}" is not a directory`);
        let directory = root as FileSystemDirectoryHandle;
        for (const segment of segments) directory = await directory.getDirectoryHandle(segment, { create });
        return directory;
    }

    private static async getFileHandle(path: string, create: boolean): Promise<FileSystemFileHandle> {
        if (!path.includes('/')) {
            const root = await $FileSystem.getHandle(path);
            if (root.kind !== 'file') throw new Error(`Path "${path}" is not a file`);
            return root as FileSystemFileHandle;
        }
        const directory = await $FileSystem.getDirectoryHandle($Path.getDirectory(path), create);
        return directory.getFileHandle($Path.entryName(path), { create });
    }

}
