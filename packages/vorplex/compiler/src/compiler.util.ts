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

const NODE_BUILTIN_POLYFILLS: Record<string, { name: string; version: string }> = {
    util:              { name: 'util',              version: '0.12.5'  },
    events:            { name: 'events',            version: '3.3.0'   },
    stream:            { name: 'stream-browserify', version: '3.0.0'   },
    buffer:            { name: 'buffer',            version: '6.0.3'   },
    path:              { name: 'path-browserify',   version: '1.0.1'   },
    assert:            { name: 'assert',            version: '2.1.0'   },
    querystring:       { name: 'querystring-es3',   version: '0.2.1'   },
    url:               { name: 'url',               version: '0.11.4'  },
    string_decoder:    { name: 'string_decoder',    version: '1.3.0'   },
    zlib:              { name: 'browserify-zlib',   version: '0.2.0'   },
    http:              { name: 'stream-http',       version: '3.2.0'   },
    https:             { name: 'https-browserify',  version: '1.0.0'   },
    os:                { name: 'os-browserify',     version: '0.3.0'   },
    crypto:            { name: 'crypto-browserify', version: '3.12.1'  },
    vm:                { name: 'vm-browserify',     version: '1.1.2'   },
    process:           { name: 'process',           version: '0.11.10' },
    punycode:          { name: 'punycode',          version: '2.3.1'   },
    tty:               { name: 'tty-browserify',    version: '0.0.1'   },
    timers:            { name: 'timers-browserify', version: '2.0.12'  },
};

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
                            const dependencyTree = options.files[importStack.find(importPath => options.files[importPath]?.dependencyTree)]?.dependencyTree ?? options.files[importPath]?.dependencyTree ?? {};
                            const string = NPM.parseImportString(importPath);
                            task.log(`Package ${string.packageName} subpath ${string.subpath} version ${string.version}`);
                            if (!string.version) {
                                if (importerPath in options.files) {
                                    string.version = options.files[importerPath].dependencyTree[string.packageName]?.version;
                                } else {
                                    const importer = JsDelivr.parseUrl(importerPath);
                                    string.version = importer.name !== string.packageName ? NPM.resolveDependencyVersion(dependencyTree, importer.name, importer.version, string.packageName) : importer.version;
                                }
                                if (!string.version) {
                                    const polyfill = NODE_BUILTIN_POLYFILLS[string.packageName];
                                    if (polyfill) {
                                        const version = dependencyTree[polyfill.name]?.version ?? dependencyTree[string.packageName]?.version ?? polyfill.version;
                                        task.log(`Resolving Node.js built-in (${string.packageName}) via browser polyfill (${polyfill.name}@${version})`);
                                        string.packageName = polyfill.name;
                                        string.version = version;
                                    } else if (importerPath in options.files) {
                                        throw new Error(`Unable to determine package (${string.packageName}) version.`);
                                    } else {
                                        task.log(`Returning mock module for package (${string.packageName}) as import doesn't have it as a dependency.`, { level: 'warning' });
                                        return;
                                    }
                                }
                            }
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
