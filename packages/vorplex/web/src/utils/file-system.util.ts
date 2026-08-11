import { $Path } from '@vorplex/core';

export interface FileSystemPickerType {
    description?: string;
    accept: Record<string, string[]>;
}

export interface FileSystemOpenFileOptions {
    excludeAcceptAllOption?: boolean;
    types?: FileSystemPickerType[];
}

declare global {
    interface Window {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
        showOpenFilePicker?: (options?: FileSystemOpenFileOptions & { multiple?: boolean }) => Promise<FileSystemFileHandle[]>;
    }

    interface FileSystemDirectoryHandle {
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    }
}

export class $FileSystem {

    private static readonly handles = new Map<string, FileSystemHandle>();

    public static async pickFolder(): Promise<string> {
        const handle = await window.showDirectoryPicker();
        $FileSystem.handles.set(handle.name, handle);
        return handle.name;
    }

    public static async pickFile(options?: FileSystemOpenFileOptions): Promise<string> {
        const [handle] = await window.showOpenFilePicker({ ...options, multiple: false });
        $FileSystem.handles.set(handle.name, handle);
        return handle.name;
    }

    public static async pickFiles(options?: FileSystemOpenFileOptions): Promise<string[]> {
        const handles = await window.showOpenFilePicker({ ...options, multiple: true });
        return handles.map(handle => {
            $FileSystem.handles.set(handle.name, handle);
            return handle.name;
        });
    }

    public static async createFolder(path: string): Promise<void> {
        await $FileSystem.getDirectoryHandle($Path.absolute(path), true);
    }

    public static async deleteFolder(path: string): Promise<void> {
        const absolute = $Path.absolute(path);
        const parent = await $FileSystem.getDirectoryHandle($Path.getDirectory(absolute), false);
        await parent.removeEntry($Path.entryName(absolute), { recursive: true });
        $FileSystem.handles.delete(absolute);
    }

    public static async deleteFile(path: string): Promise<void> {
        const absolute = $Path.absolute(path);
        const parent = await $FileSystem.getDirectoryHandle($Path.getDirectory(absolute), false);
        await parent.removeEntry($Path.entryName(absolute));
        $FileSystem.handles.delete(absolute);
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
            const entryPath = $Path.join(absolute, name);
            $FileSystem.handles.set(entryPath, entry);
            entries.push({ path: entryPath, kind: entry.kind });
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

    private static async getDirectoryHandle(path: string, create: boolean): Promise<FileSystemDirectoryHandle> {
        const cached = $FileSystem.handles.get(path);
        if (cached) return cached as FileSystemDirectoryHandle;
        const parentPath = $Path.getDirectory(path);
        if (parentPath === path) throw new Error(`Failed to retrieve directory handle for path "${path}"`);
        const parent = await $FileSystem.getDirectoryHandle(parentPath, create);
        const handle = await parent.getDirectoryHandle($Path.entryName(path), { create });
        $FileSystem.handles.set(path, handle);
        return handle;
    }

    private static async getFileHandle(path: string, create: boolean): Promise<FileSystemFileHandle> {
        const cached = $FileSystem.handles.get(path);
        if (cached) return cached as FileSystemFileHandle;
        const directory = await $FileSystem.getDirectoryHandle($Path.getDirectory(path), create);
        const handle = await directory.getFileHandle($Path.entryName(path), { create });
        $FileSystem.handles.set(path, handle);
        return handle;
    }

}
