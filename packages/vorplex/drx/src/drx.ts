import { Compiler, JsDelivr, NPM, type DependencyTree } from '@vorplex/compiler';
import { $Id, $Object, $Path, $String, $Url, $Value, Awaitable, Scope } from '@vorplex/core';
import { version } from '../package.json';
import { DrxDocument, DrxDocumentState } from './document';
import { DrxDom } from './dom';
import { DrxIconSheet } from './icon-sheet';
import { DrxApp } from './node/app/app';
import { DrxAsset } from './node/asset';
import { DrxLibraries } from './node/libraries';
import { NodeType } from './node/node-type';
import { DrxRenderer, type DrxRenderTarget } from './renderer';

export type DrxImport = (path: string) => Awaitable<string | Uint8Array | undefined>;

export class DRX {

    public static async load(drx: string, read?: DrxImport): Promise<DrxDocument> {
        read ??= async path => {
            const response = await fetch(path);
            return response.ok ? new Uint8Array(await response.arrayBuffer()) : undefined;
        };
        const libraries = new Map<string, DrxDocument | undefined>();
        const readText = async (path: string) => {
            const content = await read(path);
            return content instanceof Uint8Array ? new TextDecoder().decode(content) : content;
        };
        const loadDocument = async (drx: string, root: string | undefined): Promise<DrxDocument> => {
            const locate = (path: string) => root ? $Url.resolve(root, path) : path;
            const resolve = async (drx: string, base: string) => {
                const dom = new DOMParser().parseFromString(drx, 'text/html');
                for (const element of Array.from(dom.body.querySelectorAll('x-import'))) {
                    const src = DrxDom.getRequiredAttribute(element, 'src');
                    const path = $Path.join(base, src);
                    const content = await readText(locate(path)) ?? '';
                    if (path.endsWith('.ts')) {
                        const script = dom.createElement('script');
                        script.setAttribute('type', 'application/typescript');
                        script.textContent = content;
                        element.replaceWith(script);
                    } else if (path.endsWith('.css')) {
                        const style = dom.createElement('style');
                        style.textContent = content;
                        element.replaceWith(style);
                    } else {
                        const nested = await resolve(content, path.includes('/') ? $Path.getDirectory(path) : '');
                        element.replaceWith(...Array.from(nested.body.childNodes));
                    }
                }
                for (const element of Array.from(dom.body.children)) {
                    if (!element.hasAttribute('x-base')) element.setAttribute('x-base', base);
                }
                return dom;
            };
            const document = DRX.from(await resolve(drx, ''));
            await document.loadFiles(path => read(locate(path)));
            return document;
        };
        const link = async (document: DrxDocument): Promise<DrxDocument> => {
            const linked: Record<string, DrxDocument> = {};
            for (const [name, declared] of Object.entries(document.state.value.app.libraries ?? {})) {
                if (!$Url.isAbsolute(declared)) continue;
                const library = await loadLibrary(DrxLibraries.getEntryUrl(declared));
                if (library) linked[name] = library;
            }
            document.libraries.set(linked);
            return document;
        };
        const loadLibrary = async (url: string): Promise<DrxDocument | undefined> => {
            if (libraries.has(url)) return libraries.get(url);
            let library: DrxDocument | undefined;
            try {
                const source = await readText(url);
                if (source === undefined) throw new Error(`Library with url "${url}" does not exist`);
                library = await loadDocument(source, url);
            } catch (error) {
                console.error(`Failed to load library with url "${url}"`, error);
            }
            libraries.set(url, library);
            if (library) await link(library);
            return library;
        };
        return link(await loadDocument(drx, undefined));
    }

    public static async render(document: DrxDocument, parent: Element, options: { bundle?: string; target?: DrxRenderTarget } = {}): Promise<Scope | undefined> {
        return DrxDom.bootstrap(parent, async () => {
            const bundle = options.bundle ?? await DRX.bundle(document);
            return new DrxRenderer(document, { bundle }).render(parent, options.target);
        });
    }

    public static async bundle(document: DrxDocument) {
        const state = document.state.value;
        const entries: {
            id: string;
            path: string;
            content: string;
            packages?: Record<string, string>;
            dependencyTree?: DependencyTree;
        }[] = [];
        const app = state.app;
        if (app.script?.trim()) entries.push({ id: app.id, path: 'script://app.ts', content: app.script, packages: app.packages, dependencyTree: app.dependencyTree });
        for (const pageId of app.pageIds) {
            const page = state.pages[pageId];
            if (page.script?.trim()) entries.push({ id: page.id, path: `script://pages/${page.name}.ts`, content: page.script, packages: app.packages, dependencyTree: app.dependencyTree });
        }
        const getServiceScriptEntries = (state: DrxDocumentState, serviceIds: string[]) => {
            for (const serviceId of serviceIds) {
                const service = state.services[serviceId];
                if (service.script?.trim()) entries.push({ id: service.id, path: `script://services/${service.name}-${service.id}.ts`, content: service.script, packages: state.app.packages, dependencyTree: state.app.dependencyTree });
            }
        };
        const getComponentScriptEntries = (state: DrxDocumentState, componentId: string) => {
            const component = state.components[componentId];
            if (component.script?.trim()) entries.push({ id: component.id, path: `script://components/${component.name}-${component.id}.ts`, content: component.script, packages: state.app.packages, dependencyTree: state.app.dependencyTree });
            getServiceScriptEntries(state, component.serviceIds);
            for (const childId of component.componentIds) getComponentScriptEntries(state, childId);
        };
        getServiceScriptEntries(state, app.serviceIds);
        for (const componentId of app.componentIds) getComponentScriptEntries(state, componentId);
        for (const library of Object.values(document.getLibraryDocuments())) {
            const libraryState = library.state.value;
            getServiceScriptEntries(libraryState, libraryState.app.serviceIds);
            for (const componentId of libraryState.app.componentIds) getComponentScriptEntries(libraryState, componentId);
        }
        if (!entries.length) return '';
        const dependencyTrees = new Map<Record<string, string>, Promise<DependencyTree>>();
        const resolveTree = (packages?: Record<string, string>, persisted?: DependencyTree): Promise<DependencyTree> => {
            if (!packages) return Promise.resolve({});
            if (persisted && Object.keys(packages).every(name => persisted[name])) return Promise.resolve(persisted);
            if (!dependencyTrees.has(packages)) dependencyTrees.set(packages, NPM.resolveDependencyTree(packages, JsDelivr));
            return dependencyTrees.get(packages)!;
        };
        const files: Record<string, { content: string; dependencyTree?: DependencyTree }> = {};
        await Promise.all(entries.map(async entry => {
            const dependencyTree = await resolveTree(entry.packages, entry.dependencyTree);
            files[entry.path] = { content: entry.content, dependencyTree };
        }));
        const entryPath = 'entry.ts';
        files[entryPath] = {
            content: `export default { ${entries.map(entry => `'${entry.id}': require('${entry.path}').default`).join(', ')} };`
        };
        return await Compiler.compile({ files, entryFilePath: entryPath });
    }

    public static async compile(document: DrxDocument) {
        const runtimeUrl = `https://cdn.jsdelivr.net/npm/@vorplex/drx@${version}/dist/standalone`;
        const serialized = $Value.clone(document.serialize());
        const state = serialized.app;
        const [bundle, icons, runtime] = await Promise.all([
            DRX.bundle(document),
            fetch(DrxIconSheet.url).then(response => response.text()),
            fetch(`${runtimeUrl}/runtime.js`).then(response => response.text())
        ]);
        const files: { path: string; data: Uint8Array; contentType: string }[] = [];
        const text = (path: string, contentType: string, content: string) => ({ path, contentType, data: new TextEncoder().encode(content) });
        const sources: [DrxDocument, DrxDocumentState][] = [
            [document, serialized.app],
            ...Object.entries(document.getLibraryDocuments()).map(([url, library]): [DrxDocument, DrxDocumentState] => [library, serialized.libraries[url]])
        ];
        await Promise.all(sources.flatMap(([source, target]) => Object.values(target.assets).map(async asset => {
            if (asset.source.type !== 'external') return;
            const filePath = DrxAsset.getFilePath(asset);
            const url = filePath ? source.getFileUrl(filePath) : asset.source.url;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to download asset with name "${asset.name}" from url "${url}": ${response.status} ${response.statusText}`);
            const path = `assets/${asset.id}`;
            files.push({ path, data: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get('content-type') ?? 'application/octet-stream' });
            target.assets[asset.id] = { ...asset, source: { type: 'external', url: path } };
        })));
        files.push(...[
            text('index.html', 'text/html', $String.dedent(`
                <!doctype html>
                <html>
                    <head>
                        <script type="module">
                            import { bootstrap } from './drx.js';
                            bootstrap({ documents: 'app.json', bundle: 'bundle.js', icons: 'icons.svg' });
                        </script>
                        ${state.app.pwaMetadata ? '<link rel="manifest" href="manifest.json" />' : ''}
                        ${!$String.isNullOrEmpty(state.app.pwaMetadata?.theme_color) ? `<meta name="theme-color" content="${state.app.pwaMetadata.theme_color}" />` : ''}
                    </head>
                    <body></body>
                </html>
                `)),
            text('bundle.js', 'application/javascript', bundle),
            text('icons.svg', 'image/svg+xml', icons),
            text('drx.js', 'application/javascript', runtime),
            text('app.json', 'application/json', JSON.stringify(serialized)),
        ]);
        if (state.app.pwaMetadata) {
            const serviceWorker = await fetch(`${runtimeUrl}/pwa-service-worker.js`).then(response => response.text());
            const pwa = state.app.pwaMetadata;
            const manifest = {
                ...pwa,
                short_name: pwa.short_name ?? pwa.name,
                display: pwa.display ?? 'standalone',
                start_url: '.',
                scope: '.',
                hash: $Id.guid(),
                files: files.map(file => file.path)
            };
            files.push(text('manifest.json', 'application/json', JSON.stringify(manifest)));
            files.push(text('pwa-service-worker.js', 'application/javascript', serviceWorker));
        }
        return files;
    }

    public static parse(drx: string): DrxDocument {
        return DRX.from(new DOMParser().parseFromString(drx, 'text/html'));
    }

    private static from(dom: Document): DrxDocument {
        const state = DrxDocumentState.new();
        return new DrxDocument($Object.removeUndefinedProperties({
            ...state,
            app: DrxApp.parse(dom.body.querySelector(`:scope > ${NodeType.App}`), state)
        }));
    }

}
