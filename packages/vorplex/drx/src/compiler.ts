import { $String } from '@vorplex/core';
import { DrxDocumentState } from './drx';
import { ICON_SHEET_URL } from './icon-sheet';
import { DrxScriptBundler } from './script-bundler';

export interface DrxCompiledFile {
    path: string;
    data: Uint8Array;
    contentType: string;
}

export const DrxCompiler = {
    async compile(state: DrxDocumentState): Promise<DrxCompiledFile[]> {
        const [bundle, icons, runtime] = await Promise.all([
            DrxScriptBundler.bundle(state),
            fetch(ICON_SHEET_URL).then(response => response.text()),
            fetch('https://cdn.jsdelivr.net/gh/Vorplex/mono@shtml/packages/vorplex/drx/standalone/cdn/runtime.js').then(response => response.text())
        ]);
        const assets = { ...state.assets };
        const text = (path: string, contentType: string, content: string): DrxCompiledFile => ({ path, contentType, data: new TextEncoder().encode(content) })
        const files: DrxCompiledFile[] = [
            text('index.html', 'text/html', $String.dedent(`
                <!doctype html>
                <html>
                    <head>
                        <script src="drx.js"></script>
                    </head>
                    <body></body>
                </html>
            `)),
            text('bundle.js', 'application/javascript', bundle),
            text('icons.svg', 'image/svg+xml', icons),
            text('drx.js', 'application/javascript', runtime)
        ];
        await Promise.all(Object.values(state.assets).map(async asset => {
            if (asset.source.type !== 'external') return;
            const response = await fetch(asset.source.url);
            const path = `assets/${asset.id}`;
            files.push({ path, data: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get('content-type') ?? 'application/octet-stream' });
            assets[asset.id] = { ...asset, source: { type: 'external', url: path } };
        }));
        files.push(text('app.json', 'application/json', JSON.stringify({ ...state, assets })));
        return files;
    }
};
