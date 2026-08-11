import { $FileSystem } from '@vorplex/node';
import { context } from 'esbuild';
import { solidPlugin } from 'esbuild-plugin-solid';
import * as fs from 'fs';

fs.rmSync('./dist', { recursive: true, force: true });
await $FileSystem.copy({
    './public': './dist',
    './node_modules/monaco-editor/': './dist/assets/monaco-editor',
});

const [buildContext] = await Promise.all([
    context({
        tsconfig: './tsconfig.json',
        entryPoints: ['./src/index.tsx'],
        bundle: true,
        outfile: './dist/bundle.js',
        platform: 'browser',
        format: 'esm',
        minify: false,
        treeShaking: false,
        sourcemap: true,
        supported: { decorators: false },
        jsx: 'preserve',
        jsxImportSource: 'solid-js',
        loader: {
            '.ttf': 'file',
        },
        plugins: [
            solidPlugin({
                typescript: { allowDeclareFields: true },
                babel: {
                    plugins: [
                        ['@babel/plugin-proposal-decorators', { version: '2023-11' }]
                    ]
                }
            }),
        ]
    })
]);

const mode = process.argv[2] || 'build';

if (mode === 'serve') {
    await Promise.all([buildContext.watch()]);
    const host = process.env.HOST || 'localhost';
    const port = parseInt(process.env.PORT || '4200', 10);
    await buildContext.serve({
        servedir: './dist',
        host,
        port,
    });
    console.log(`🚀 Development server running at http://${host}:${port}`);

    const shutdown = async () => {
        await buildContext.dispose();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
} else {
    await Promise.all([buildContext.rebuild()]);
    await Promise.all([buildContext.dispose()]);
    console.log('✅ Build completed successfully');
}
