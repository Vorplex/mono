import { $Path, State } from '@vorplex/core';
import { build, initialize } from 'esbuild-wasm';
import { JsDelivr } from '../npm/jsdelivr/jsdelivr.util';

export class Bundler {
    private static async initialize() {
        const initialized: State<'initializing' | 'initialized'> = (Bundler.initialize[':state'] ??= new State());
        if (initialized.value === undefined) {
            initialized.update('initializing');
            try {
                await initialize({
                    wasmURL: $Path.join(JsDelivr.url, 'esbuild-wasm@0.25.10', 'esbuild.wasm'),
                });
                initialized.update('initialized');
            } catch (error) {
                initialized.update(undefined);
                throw error;
            }
        }
        await initialized.until((initialized) => initialized.value === 'initialized');
    }

    public static async bundle(options: {
        path: string;
        script: string;
        sourcemaps?: boolean;
        resolve: (event: { namespace: string; importerPath: string; importPath: string, relative: boolean, importStack: string[] }) => Promise<{ namespace: string } | { path?: string; content: string }>;
    }) {
        await Bundler.initialize();
        const result = await build({
            stdin: {
                contents: options.script,
                resolveDir: '/',
                loader: 'ts',
            },
            plugins: [
                {
                    name: 'module-loader-resolver',
                    setup: (build) => {
                        const files: Record<string, string> = {};
                        const importParent: Record<string, string> = {};
                        const importPathAlias: Record<string, string> = {};
                        build.onResolve({ filter: /.*/ }, async (args) => {
                            const relative = args.path.startsWith('.') || args.path.startsWith('/');
                            const importerPath = args.importer === '<stdin>' ? options.path : args.importer;
                            const importPath = relative ? $Path.join(importerPath, `../${args.path}`) : args.path;

                            importParent[importPath] = importerPath;
                            let importStack = [];
                            let parentPath = importerPath;
                            while (parentPath) {
                                importStack.push(parentPath);
                                parentPath = importParent[importPathAlias[parentPath]] ?? importParent[parentPath];
                            }
                            const resolved = await options.resolve({
                                namespace: args.path,
                                importerPath,
                                importPath,
                                relative,
                                importStack
                            });
                            if (!resolved) return { path: importPath, namespace: 'mock' };
                            if ('content' in resolved) {
                                files[resolved.path ?? importPath] = resolved.content;
                                if (resolved.path) importPathAlias[resolved.path] = importPath;
                                return {
                                    path: resolved.path ?? importPath,
                                    namespace: 'virtual',
                                };
                            } else
                                return {
                                    path: resolved.namespace,
                                    external: true,
                                };
                        });

                        build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
                            const loaders = {
                                '.tsx': 'tsx',
                                '.ts': 'ts',
                                '.js': 'js',
                                '.jsx': 'jsx',
                                '.css': 'css',
                                '.json': 'json',
                            };
                            const extension = $Path.getExtension(args.path);
                            const loader = loaders[extension];
                            const file = files[args.path];
                            delete files[args.path];
                            return { contents: file, loader };
                        });

                        build.onLoad({ filter: /.*/, namespace: 'mock' }, (args) => {
                            return { contents: 'export default {}' };
                        });
                    },
                },
            ],
            sourcemap: options.sourcemaps ? 'inline' : false,
            mainFields: ['module', 'main'],
            conditions: ['import', 'module'],
            bundle: true,
            format: 'cjs',
            target: 'esnext',
            platform: 'browser',
            minify: !options.sourcemaps,
            treeShaking: !options.sourcemaps,
            logLevel: 'silent',
        });
        return result.outputFiles[0].text;
    }
}
