import * as fs from 'fs';
import * as path from 'path';

export class $FileSystem {
    public static isDirectory(target: string): boolean {
        return fs.statSync(target).isDirectory();
    }

    public static isFile(target: string): boolean {
        return fs.statSync(target).isFile();
    }

    public static async copy(source: string, destination: string): Promise<void>
    public static async copy(paths: Record<string, string>): Promise<void>
    public static async copy(...args: any[]): Promise<void> {
        if (args.length === 1 && typeof args[0] === 'object' && args[0] != null) {
            const paths = args[0] as Record<string, string>;
            await Promise.all(Object.entries(paths).map(([source, destination]) => $FileSystem.copy(source, destination)));
        } else {
            const source = path.relative(process.cwd(), args[0]);
            const destination = path.relative(process.cwd(), args[1]);
            if ($FileSystem.isDirectory(source)) {
                if (!$FileSystem.exists(destination)) await $FileSystem.createDirectory(destination);
                const entries = await $FileSystem.getEntries(source);
                await Promise.all(entries.map(async (entry) => {
                    const relativePath = path.relative(source, entry.path);
                    const destinationPath = path.join(destination, relativePath);
                    await $FileSystem.copy(entry.path, destinationPath);
                }));
            } else {
                const directory = path.dirname(destination);
                await $FileSystem.createDirectory(directory);
                await fs.promises.copyFile(source, destination);
            }
        }
    }

    public static path(...paths: string[]) {
        return path.join(...paths);
    }

    public static async readFileText(filepath: string): Promise<string | null> {
        const exists = $FileSystem.exists(filepath);
        if (!exists) return null;
        return await fs.promises.readFile(filepath, 'utf-8');
    }

    public static async readFileJson(filepath: string): Promise<any | null> {
        const json = await $FileSystem.readFileText(filepath);
        if (!json) return null;
        return JSON.parse(json);
    }

    public static async writeFileText(filepath: string, content: string): Promise<void> {
        const dir = path.dirname(filepath);
        await $FileSystem.createDirectory(dir);
        await fs.promises.writeFile(filepath, content, 'utf-8');
    }

    public static async writeFileJson(filepath: string, content: any): Promise<void> {
        await $FileSystem.writeFileText(filepath, JSON.stringify(content, null, 4));
    }

    public static async createDirectory(directoryPath: string): Promise<void> {
        await fs.promises.mkdir(directoryPath, { recursive: true });
    }

    public static exists(targetPath: string): boolean {
        try {
            fs.accessSync(targetPath);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') return false;
            throw error;
        }
    }

    public static async getEntries(
        directory: string,
        options?: {
            regex?: RegExp;
            type?: 'file' | 'directory';
            recursive?: boolean | { depth?: number };
        },
    ): Promise<{ type: 'file' | 'directory'; path: string }[]> {
        const results: { type: 'file' | 'directory'; path: string }[] = [];

        async function recurse(directory: string, depth: number) {
            const entries = await fs.promises.readdir(directory, {
                withFileTypes: true,
            });
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                if (entry.isDirectory()) {
                    if (options?.type == null || options?.type === 'directory') {
                        if (options?.regex == null || options?.regex.test(entry.name)) {
                            results.push({
                                type: 'directory',
                                path: path.resolve(fullPath),
                            });
                        }
                    }
                    if (typeof options?.recursive === 'boolean' && options.recursive || typeof options?.recursive === 'object' && options?.recursive != null && depth < options.recursive.depth) await recurse(fullPath, depth + 1);
                } else if (options?.type == null || options?.type === 'file') {
                    if (options?.regex == null || options?.regex.test(entry.name)) {
                        results.push({
                            type: 'file',
                            path: path.resolve(fullPath),
                        });
                    }
                }
            }
        }

        await recurse(directory, 0);
        return results;
    }

    public static async delete(targetPath: string): Promise<void> {
        if (!$FileSystem.exists(targetPath)) return;
        const stats = await fs.promises.lstat(targetPath);
        if (stats.isDirectory()) {
            await fs.promises.rm(targetPath, { recursive: true, force: true });
        } else {
            await fs.promises.unlink(targetPath);
        }
    }
}
