import { Task } from '@vorplex/core';
import { stringify } from 'yaml';
import { Bundler } from './module-loader/bundler';
import { JsDelivr } from './npm/jsdelivr/jsdelivr.util';
import { type DependencyTree, NPM } from './npm/npm.util';

export interface CompilerOptions {
    files: Record<string, { content: string; dependencyTree?: DependencyTree }>;
    entryFilePath: string;
    sourcemaps?: boolean;
    task?: Task
}

export class Compiler {

    public static async compile(options: CompilerOptions) {
        const task = options.task ?? new Task('Compile');
        try {
            task.log(`Compiling $[files] using entry file path (${options.entryFilePath})`, { attachments: { files: { type: 'yaml', value: stringify(options.files) } } });
            return await Bundler.bundle({
                path: options.entryFilePath,
                script: options.files[options.entryFilePath].content,
                sourcemaps: options.sourcemaps,
                resolve: async ({ importerPath, importPath, importStack }) => {
                    return await task.do(`Resolving: ${importPath}`, async task => {
                        if (importPath in options.files) {
                            task.log('Returning local file $[content]', { attachments: { content: { type: 'typescript', value: options.files[importPath].content } } });
                            return { content: options.files[importPath].content };
                        }
                        if (importPath.startsWith('https://')) {
                            if (importPath.startsWith(JsDelivr.url)) {
                                const { name, version, path } = JsDelivr.parseUrl(importPath);
                                try {
                                    const file = await JsDelivr.getFile(name, version, path);
                                    task.log('Returning file $[content] from CDN', { attachments: { content: { type: 'text', value: file.content } } });
                                    return {
                                        path: file.url,
                                        content: file.content,
                                    };
                                } catch (error) {
                                    task.fail(error);
                                    throw error;
                                }
                            } else {
                                task.log('Fetching external file content');
                                const response = await fetch(importPath);
                                if (!response.ok) throw new Error(`Failed to resolve import (${importPath}). ${response.statusText}`);
                                const content = await response.text();
                                task.log('Returning external file $[content]', { attachments: { content: { type: 'text', value: content } } });
                                return { content };
                            }
                        }
                        try {
                            const dependencyTree = options.files[importStack.find(importPath => options.files[importPath]?.dependencyTree)]?.dependencyTree ?? options.files[importPath].dependencyTree ?? {};
                            const string = NPM.parseImportString(importPath);
                            task.log(`Package ${string.packageName} subpath ${string.subpath} version ${string.version}`);
                            if (!string.version) {
                                if (importerPath in options.files) {
                                    string.version = options.files[importerPath].dependencyTree[string.packageName]?.version;
                                } else {
                                    const importer = JsDelivr.parseUrl(importerPath);
                                    string.version = importer.name !== string.packageName ? NPM.resolveDependencyVersion(dependencyTree, importer.name, importer.version, string.packageName) : importer.version;
                                    if (!string.version) {
                                        task.log(`Returning mock module for package (${string.packageName}) as import (${importer.name}) doesn't have it as a dependency.`, { level: 'warning' });
                                        return;
                                    }
                                }
                            }
                            if (!string.version) throw new Error(`Unable to determine package (${string.packageName}) version.`);
                            const filePath = await JsDelivr.resolveImportFilePath(string.packageName, string.version, string.subpath);
                            task.log(`Import resolved to file path (${filePath})`);
                            const file = await JsDelivr.getFile(string.packageName, string.version, filePath);
                            task.log('Returning file $[content] from CDN', { attachments: { content: { type: 'text', value: file.content } } });
                            return { path: file.url, content: file.content };
                        } catch (error) {
                            task.fail(error);
                            throw error;
                        }
                    });
                },
            });
        } catch (error) {
            task.fail(error);
            throw error;
        } finally {
            task.complete();
        }
    }

}
