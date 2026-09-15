import { $Path, $String, createIdentifier, InMemoryStorage, type StorageProvider } from '@vorplex/core';
import { NPM, PackageImport } from '../npm.util';
import type { PackageJson } from '../package-json.type';

export interface JsDelivrData {
    name: string;
    version: string;
    default: string;
    files: JsDelivrFileEntry[];
}

export interface JsDelivrFileEntry {
    type: 'directory' | 'file';
    name: string;
    files: JsDelivrFileEntry[];
}

export interface PackageFile {
    packageName: string;
    packageVersion: string;
    url: string;
    path?: string;
    content: string;
}

export const PackageVersionCacheKey = createIdentifier({
    name: String,
    version: String
});
export type PackageVersionCacheKey = ReturnType<typeof PackageVersionCacheKey>;

export const PackageFileCacheKey = createIdentifier({
    name: String,
    version: String,
    path: String
});
export type PackageFileCacheKey = ReturnType<typeof PackageFileCacheKey>;

export type JsDelivrStorageDefinition = {
    cache: {
        'package-version': Record<PackageVersionCacheKey, string>,
        data: Record<PackageVersionCacheKey, JsDelivrData>,
        'file-path': Record<PackageFileCacheKey, string>,
        file: Record<PackageFileCacheKey, PackageFile>,
        'package-json': Record<PackageVersionCacheKey, PackageJson>
    }
};

export const JsDelivr = {

    url: 'https://cdn.jsdelivr.net/npm' as const,
    dataUrl: 'https://data.jsdelivr.com/v1/packages/npm' as const,
    resolveUrl: 'https://data.jsdelivr.com/v1/package/resolve/npm' as const,
    cache: new InMemoryStorage<JsDelivrStorageDefinition>() as StorageProvider<JsDelivrStorageDefinition>,

    async resolveVersion(name: string, semanticVersion?: string) {
        semanticVersion ??= 'latest';
        const key = PackageVersionCacheKey({ name, version: semanticVersion });
        const cached = await JsDelivr.cache.get('cache', 'package-version', key);
        if (cached) return cached;
        const url = $Path.join(JsDelivr.resolveUrl, `${name}@${semanticVersion}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package "${name}" version "${semanticVersion}". ${response.statusText}`);
        const data = (await response.json()) as { version: string };
        await JsDelivr.cache.set('cache', 'package-version', key, data.version);
        return data.version;
    },

    async getPackageVersions(name: string): Promise<string[]> {
        const url = $Path.join(JsDelivr.dataUrl, name);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package "${name}" versions. ${response.statusText}`);
        const data = (await response.json()) as {
            versions: { version: string }[];
        };
        return data.versions.map((version) => version.version);
    },

    async getData(name: string, semanticVersion?: string): Promise<JsDelivrData> {
        const version = await JsDelivr.resolveVersion(name, semanticVersion);
        const key = PackageVersionCacheKey({ name, version });
        const cached = await JsDelivr.cache.get('cache', 'data', key);
        if (cached) return cached;
        const url = $Path.join(JsDelivr.dataUrl, `${name}@${version}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package "${name}" metadata. ${response.statusText}`);
        const data = await response.json();
        await JsDelivr.cache.set('cache', 'data', key, data);
        return data;
    },

    async getFilePaths(name: string, semanticVersion?: string, regex?: RegExp): Promise<string[]> {
        const version = await JsDelivr.resolveVersion(name, semanticVersion);
        const metadata = await JsDelivr.getData(name, version);
        function getFiles(target: { files: JsDelivrFileEntry[] }, path: string) {
            const files: string[] = [];
            for (const entry of target.files) {
                const entryPath = $Path.join(path, entry.name);
                if (entry.type === 'directory') for (const file of getFiles(entry, entryPath)) files.push(file);
                else if (entryPath.match(regex)) files.push(entryPath);
            }
            return files;
        }
        return getFiles(metadata, '/');
    },

    async resolveFilePath(name: string, semanticVersion: string, path: string): Promise<string> {
        const version = await JsDelivr.resolveVersion(name, semanticVersion);
        const key = PackageFileCacheKey({ name, version, path });
        const cached = await JsDelivr.cache.get('cache', 'file-path', key);
        if (cached) return cached;
        const paths = await JsDelivr.getFilePaths(name, version, new RegExp('^' + $String.sanitizeForRegex($Path.absolute(path)) + '(?:\\.js|/index.js)?$'));
        function getPathPriority(filePath: string): number {
            if (filePath === path) return 4;
            if (filePath === path + '.js') return 3;
            if (filePath === path + '/index.js') return 2;
            return 1;
        }
        const resolved = paths.sort((a, b) => getPathPriority(b) - getPathPriority(a))[0];
        if (resolved) await JsDelivr.cache.set('cache', 'file-path', key, resolved);
        return resolved;
    },

    async getFile(name: string, semanticVersion?: string, path?: string): Promise<PackageFile> {
        const resolvedVersion = await JsDelivr.resolveVersion(name, semanticVersion);
        const resolvedPath = path ? await JsDelivr.resolveFilePath(name, resolvedVersion, path) : null;
        if (path && !resolvedPath) throw new Error(`Failed to resolve path "${path}" from package "${name}" version "${semanticVersion}". Not Found.`);
        const key = PackageFileCacheKey({ name, version: resolvedVersion, path: resolvedPath ?? '' });
        const cached = await JsDelivr.cache.get('cache', 'file', key);
        if (cached) return cached;
        const url = $Path.join(JsDelivr.url, `${name}@${resolvedVersion}`, resolvedPath);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package "${name}" file "${resolvedPath ?? '<default>'}". ${response.statusText}`);
        const version = response.headers.get('x-jsd-version');
        const file: PackageFile = {
            packageName: name,
            packageVersion: version,
            url: $Path.join(JsDelivr.url, `${name}@${version}`, resolvedPath),
            path: resolvedPath,
            content: await response.text(),
        };
        await JsDelivr.cache.set('cache', 'file', key, file);
        return file;
    },

    async getPackageJson(name: string, semanticVersion?: string): Promise<PackageJson> {
        const version = await JsDelivr.resolveVersion(name, semanticVersion);
        const key = PackageVersionCacheKey({ name, version });
        const cached = await JsDelivr.cache.get('cache', 'package-json', key);
        if (cached) return cached;
        const { content } = await JsDelivr.getFile(name, semanticVersion, 'package.json');
        const packageJson = JSON.parse(content);
        await JsDelivr.cache.set('cache', 'package-json', key, packageJson);
        return packageJson;
    },

    parseUrl(url: string): PackageImport {
        return url.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/(?<name>@?[^@]+)(?:@(?<version>[^/]+))?(?:\/(?<path>.*))?/)?.groups as any;
    },

    async resolveImportFilePath(packageName: string, semanticVersion?: string, subpath?: string): Promise<string> {
        const version = await JsDelivr.resolveVersion(packageName, semanticVersion);
        const key = PackageFileCacheKey({ name: packageName, version, path: subpath ?? '' });
        const cached = await JsDelivr.cache.get('cache', 'file-path', key);
        if (cached) return cached;
        const packageJson = await JsDelivr.getPackageJson(packageName, version);
        const filePaths = await JsDelivr.getFilePaths(packageName, version);
        const entryPoint = NPM.getPackageEntryPoint(packageJson, filePaths, subpath);
        if (entryPoint) {
            await JsDelivr.cache.set('cache', 'file-path', key, entryPoint);
            return entryPoint;
        }
        if (subpath) {
            const file = await JsDelivr.resolveFilePath(packageName, version, subpath);
            if (file) {
                await JsDelivr.cache.set('cache', 'file-path', key, file);
                return file;
            }
        }
        throw new Error(`Failed to resolve file path for import "${packageName}${subpath ? `/${subpath}` : ''}@${semanticVersion}"`);
    }
}
