import { $Path, $String } from '@vorplex/core';
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

export class JsDelivr {
    public static readonly url = 'https://cdn.jsdelivr.net/npm' as const;
    public static readonly dataUrl = 'https://data.jsdelivr.com/v1/packages/npm' as const;
    public static readonly resolveUrl = 'https://data.jsdelivr.com/v1/package/resolve/npm' as const;
    public static packageVersionCache: Record<string, Record<string, string>> = {};

    public static async resolveVersion(name: string, semanticVersion?: string) {
        semanticVersion ??= 'latest';
        if (this.packageVersionCache[name]?.[semanticVersion]) return this.packageVersionCache[name][semanticVersion];
        const url = $Path.join(this.resolveUrl, `${name}@${semanticVersion}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package (${name}) version (${semanticVersion}). ${response.statusText}`);
        const data = (await response.json()) as { version: string };
        this.packageVersionCache[name] = Object.assign({}, this.packageVersionCache[name], { [semanticVersion]: data.version });
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
        const url = $Path.join(this.dataUrl, `${name}@${version}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package (${name}) metadata. ${response.statusText}`);
        return await response.json();
    }

    public static async getFilePaths(name: string, semanticVersion: string, regex?: RegExp): Promise<string[]> {
        const version = await this.resolveVersion(name, semanticVersion);
        const metadata = await this.getData(name, version);
        function getFiles(target: { files: JsDelivrFileEntry[] }, path: string) {
            const files: string[] = [];
            for (const entry of target.files) {
                const entryPath = $Path.join(path, entry.name);
                if (entry.type === 'directory') files.push(...getFiles(entry, entryPath));
                else if (entryPath.match(regex)) files.push(entryPath);
            }
            return files;
        }
        return getFiles(metadata, '/');
    }

    public static async resolveFilePath(name: string, semanticVersion: string, path: string): Promise<string> {
        const paths = await this.getFilePaths(name, semanticVersion, new RegExp('^' + $String.sanitizeForRegex($Path.absolute(path)) + '(?:\\.js|/index.js)?$'));
        function getPathPriority(filePath: string): number {
            if (filePath === path) return 4;
            if (filePath === path + '.js') return 3;
            if (filePath === path + '/index.js') return 2;
            return 1;
        }
        return paths.sort((a, b) => getPathPriority(b) - getPathPriority(a))[0];
    }

    public static async getFile(
        name: string,
        semanticVersion: string,
        path?: string,
    ): Promise<{
        packageName: string;
        packageVersion: string;
        url: string;
        path?: string;
        content: string;
    }> {
        const resolvedPath = path ? await this.resolveFilePath(name, semanticVersion, path) : null;
        if (path && !resolvedPath) throw new Error(`Failed to resolve path (${path}) from package (${name}) version (${semanticVersion}). Not Found.`);
        const url = $Path.join(this.url, `${name}@${semanticVersion ?? 'latest'}`, resolvedPath);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch package (${name}) file (${resolvedPath ?? '<default>'}). ${response.statusText}`);
        const version = response.headers.get('x-jsd-version');
        return {
            packageName: name,
            packageVersion: version,
            url: $Path.join(this.url, `${name}@${version}`, resolvedPath),
            path: resolvedPath,
            content: await response.text(),
        };
    }

    public static async getPackageJson(name: string, semanticVersion: string): Promise<PackageJson> {
        const { content } = await this.getFile(name, semanticVersion, 'package.json');
        return JSON.parse(content);
    }

    public static parseUrl(url: string): {
        name: string;
        version: string;
        path?: string;
    } {
        return url.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/(?<name>@?[^@]+)@(?<version>[^/]+)(?:\/(?<path>.*))?/)?.groups as any;
    }

    public static async resolveImportFilePath(packageName: string, semanticVersion: string, subpath?: string): Promise<string> {
        const packageJson = await this.getPackageJson(packageName, semanticVersion);
        if (packageJson.exports) {
            const resolveExports = async (exports): Promise<Record<string, string>> => {
                const result: Record<string, string> = {};
                if (typeof exports === 'string') return { '.': $Path.relative(exports) };
                const resolveExportPath = (path: string | Record<string, any>) => {
                    if (!path) return;
                    if (typeof path === 'string') return path;
                    if (typeof path !== 'object') return;
                    const priorities = ['browser', 'import', 'es2015', 'module', 'default', 'node', 'require'];
                    for (const priority of priorities) {
                        const resolvedPath = resolveExportPath(path[priority]);
                        if (resolvedPath) return resolvedPath;
                    }
                };
                for (const [path, value] of Object.entries(exports)) {
                    let targetPath = resolveExportPath(value);
                    if (!targetPath || targetPath === './') continue;
                    if (targetPath.startsWith('./')) targetPath = targetPath.slice(2);
                    if ($Path.getExtension(targetPath) === '.cjs') continue;
                    if (targetPath.includes('*')) {
                        const regex = new RegExp(`^${$String.sanitizeForRegex(targetPath).replace('\\*', '(.+)')}$`);
                        const files = await this.getFilePaths(packageName, semanticVersion, regex);
                        for (const file of files) {
                            const fileExtension = $Path.getExtension(file);
                            if (!['.js', '.mjs', '.json', '.jsx'].includes(fileExtension)) continue;
                            const wildcard = file.match(regex)[1];
                            const resolvedPath = path.replaceAll('*', wildcard);
                            const resolvedTargetPath = targetPath.replaceAll('*', wildcard);
                            if (Object.values(result).includes($Path.relative(resolvedTargetPath))) continue;
                            result[resolvedPath] = $Path.relative(resolvedTargetPath);
                        }
                    } else {
                        if (Object.values(result).includes($Path.relative(targetPath))) continue;
                        result[path] = $Path.relative(targetPath);
                    }
                }
                return result;
            };
            const exports = await resolveExports(packageJson.exports);
            if (!subpath && exports['.']) return $Path.absolute(exports['.']);
            if (subpath && exports[$Path.relative(subpath)]) return $Path.absolute(exports[$Path.relative(subpath)]);
        }
        if (subpath) {
            const file = await this.resolveFilePath(packageName, semanticVersion, subpath);
            if (file) return file;
        } else {
            return $Path.absolute(packageJson.module || packageJson.main || 'index.js');
        }
        throw new Error(`Failed to resolve file path for import (${packageName}${subpath ? `/${subpath}` : ''}@${semanticVersion})`);
    }
}
