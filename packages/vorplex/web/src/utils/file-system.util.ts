import { $Path } from '@vorplex/core';

declare global {
    interface Window {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
    }

    function showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

export class $FileSystem {
    private static handle: FileSystemDirectoryHandle;

    public static async open(): Promise<FileSystemDirectoryHandle> {
        $FileSystem.handle = await window.showDirectoryPicker();
        return $FileSystem.handle;
    }

    public static async getDirectoryHandle(path: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle> {
        const paths = $Path.absolute(path).split('/');
        if (paths.length === 0) return $FileSystem.handle;
        let target = paths.shift();
        let handle = $FileSystem.handle ?? (await $FileSystem.open());
        while (target) {
            handle = await handle.getDirectoryHandle(target, options);
            target = paths.shift();
        }
        return handle;
    }

    public static async getFileHandle(path: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
        const paths = $Path.absolute(path).split('/');
        if (paths.length === 0) return null;
        let target = paths.shift();
        let handle = $FileSystem.handle ?? (await $FileSystem.open());
        while (target) {
            if (paths.length > 0) handle = await handle.getDirectoryHandle(target, options);
            else return await handle.getFileHandle(target, options);
            target = paths.shift();
        }
    }

    public static async write(path: string, content: FileSystemWriteChunkType | ReadableStream) {
        const handle = await $FileSystem.getFileHandle(path, { create: true });
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

    public static async read(path: string): Promise<File> {
        const handle = await $FileSystem.getFileHandle(path);
        return await handle.getFile();
    }

    public static async createFolder(path: string) {
        await $FileSystem.getDirectoryHandle(path, { create: true });
    }

    public static async delete(path: string) {
        const directory = await $FileSystem.getDirectoryHandle($Path.getDirectory(path));
        await directory.removeEntry($Path.entryName(path), { recursive: true });
    }

}
