import { $Path, $String, InMemoryStorage, type StorageProvider } from '@vorplex/core';
import { NPM } from '../npm.util';
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

export type JsDelivrStorageDefinition = {
    cache: {
        /** @example `package@latest` */
        'package-version': { [key: `${string}@${string}`]: string },
        /** @example `package@1.2.3` */
        data: { [key: `${string}@${string}`]: JsDelivrData },
        /** @example `package@1.2.3:/src/index.js` */
        'file-path': { [key: `${string}@${string}:${string}`]: string },
        /** @example `package@1.2.3:/src/index.js` */
        file: { [key: `${string}@${string}:${string}`]: PackageFile },
        /** @example `package@1.2.3` */
        'package-json': { [key: `${string}@${string}`]: PackageJson }
    }
};

export class JsDelivr {
    public static readonly url = 'https://cdn.jsdelivr.net/npm' as const;
    public static readonly dataUrl = 'https://data.jsdelivr.com/v1/packages/npm' as const;
    public static readonly resolveUrl = 'https://data.jsdelivr.com/v1/package/resolve/npm' as const;
    public static cache: StorageProvider<JsDelivrStorageDefinition> = new InMemoryStorage<JsDelivrStorageDefinition>();

    public static async resolveVersion(name: string, semanticVersion?: string) {
        semanticVersion ??= 'latest';
        const key = `${name}@${semanticVersion}` as const;
        const cached = await this.cache.get('cache', 'package-version', key);
        if (cached) return cached;
        const url = $Path.join(this.resolveUrl, `${name}@${semanticVersion}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package (${name}) version (${semanticVersion}). ${response.statusText}`);
        const data = (await response.json()) as { version: string };
        await this.cache.set('cache', 'package-version', key, data.version);
        return data.version;
    }

    public static async getPackageVersions(name: string): Promise<string[]> {
        const url = $Path.join(this.dataUrl, name);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package (${name}) versions. ${response.statusText}`);
        const data = (await response.json()) as {
            versions: { version: string }[];
        };
        return data.versions.map((version) => version.version);
    }

    public static async getData(name: string, semanticVersion: string): Promise<JsDelivrData> {
        const version = await this.resolveVersion(name, semanticVersion);
        const key = `${name}@${version}` as const;
        const cached = await this.cache.get('cache', 'data', key);
        if (cached) return cached;
        const url = $Path.join(this.dataUrl, `${name}@${version}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package (${name}) metadata. ${response.statusText}`);
        const data = await response.json();
        await this.cache.set('cache', 'data', key, data);
        return data;
    }

    public static async getFilePaths(name: string, semanticVersion: string, regex?: RegExp): Promise<string[]> {
        const version = await this.resolveVersion(name, semanticVersion);
        const metadata = await this.getData(name, version);
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
    }

    public static async resolveFilePath(name: string, semanticVersion: string, path: string): Promise<string> {
        const version = await this.resolveVersion(name, semanticVersion);
        const key = `${name}@${version}:${path}` as const;
        const cached = await this.cache.get('cache', 'file-path', key);
        if (cached) return cached;
        const paths = await this.getFilePaths(name, version, new RegExp('^' + $String.sanitizeForRegex($Path.absolute(path)) + '(?:\\.js|/index.js)?$'));
        function getPathPriority(filePath: string): number {
            if (filePath === path) return 4;
            if (filePath === path + '.js') return 3;
            if (filePath === path + '/index.js') return 2;
            return 1;
        }
        const resolved = paths.sort((a, b) => getPathPriority(b) - getPathPriority(a))[0];
        if (resolved) await this.cache.set('cache', 'file-path', key, resolved);
        return resolved;
    }

    public static async getFile(name: string, semanticVersion: string, path?: string): Promise<PackageFile> {
        const resolvedVersion = await this.resolveVersion(name, semanticVersion);
        const resolvedPath = path ? await this.resolveFilePath(name, resolvedVersion, path) : null;
        if (path && !resolvedPath) throw new Error(`Failed to resolve path (${path}) from package (${name}) version (${semanticVersion}). Not Found.`);
        const key = `${name}@${resolvedVersion}:${resolvedPath ?? ''}` as const;
        const cached = await this.cache.get('cache', 'file', key);
        if (cached) return cached;
        const url = $Path.join(this.url, `${name}@${resolvedVersion}`, resolvedPath);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package (${name}) file (${resolvedPath ?? '<default>'}). ${response.statusText}`);
        const version = response.headers.get('x-jsd-version');
        const file: PackageFile = {
            packageName: name,
            packageVersion: version,
            url: $Path.join(this.url, `${name}@${version}`, resolvedPath),
            path: resolvedPath,
            content: await response.text(),
        };
        await this.cache.set('cache', 'file', key, file);
        return file;
    }

    public static async getPackageJson(name: string, semanticVersion: string): Promise<PackageJson> {
        const version = await this.resolveVersion(name, semanticVersion);
        const key = `${name}@${version}` as const;
        const cached = await this.cache.get('cache', 'package-json', key);
        if (cached) return cached;
        const { content } = await this.getFile(name, semanticVersion, 'package.json');
        const packageJson = JSON.parse(content);
        await this.cache.set('cache', 'package-json', key, packageJson);
        return packageJson;
    }

    public static parseUrl(url: string): {
        name: string;
        version: string;
        path?: string;
    } {
        return url.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/(?<name>@?[^@]+)@(?<version>[^/]+)(?:\/(?<path>.*))?/)?.groups as any;
    }

    public static async resolveImportFilePath(packageName: string, semanticVersion: string, subpath?: string): Promise<string> {
        const version = await this.resolveVersion(packageName, semanticVersion);
        const key = `${packageName}@${version}:${subpath ?? ''}` as const;
        const cached = await this.cache.get('cache', 'file-path', key);
        if (cached) return cached;
        const packageJson = await this.getPackageJson(packageName, version);
        const filePaths = await this.getFilePaths(packageName, version);
        const entryPoint = NPM.getPackageEntryPoint(packageJson, filePaths, subpath);
        if (entryPoint) {
            await this.cache.set('cache', 'file-path', key, entryPoint);
            return entryPoint;
        }
        if (subpath) {
            const file = await this.resolveFilePath(packageName, version, subpath);
            if (file) {
                await this.cache.set('cache', 'file-path', key, file);
                return file;
            }
        }
        throw new Error(`Failed to resolve file path for import (${packageName}${subpath ? `/${subpath}` : ''}@${semanticVersion})`);
    }
}
