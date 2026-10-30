import { Compiler, JsDelivr, NPM, type DependencyTree } from '@vorplex/compiler';
import { $Id, $MimeType, $Object, $Path, $String, $Url, $Value, Awaitable, Scope } from '@vorplex/core';
import { version } from '../package.json';
import { DrxDocument, DrxDocumentState } from './document';
import { DrxDom } from './dom';
import { DrxIconSheet } from './icon-sheet';
import { DrxApp } from './node/app/app';
import { DrxAsset } from './node/asset';
import { DrxLibraries, type DrxLibrary } from './node/libraries';
import { NodeType } from './node/node-type';
import { DrxRenderer, type DrxRenderTarget } from './renderer';

export type DrxImport = (path: string) => Awaitable<string | Uint8Array | undefined>;

export class DRX {

    public static async load(drx: string, read: DrxImport = DRX.fetch): Promise<DrxDocument> {
        const document = new DrxDocument(await DRX.resolve(drx, read));
        await DRX.link(document, read);
        return document;
    }

    public static async link(document: DrxDocument, read: DrxImport = DRX.fetch): Promise<void> {
        const libraries: Record<string, { url: string; state: DrxDocumentState }> = {};
        const visited = new Set<string>();
        const visit = async (urls: string[] = []) => {
            for (const url of urls.filter(url => $Url.isAbsolute(url)).map(url => DrxLibraries.getEntryUrl(url))) {
                if (visited.has(url)) continue;
                visited.add(url);
                try {
                    const data = await read(url);
                    const source = await DRX.readText(data);
                    if (source === undefined) throw new Error(`Library with url "${url}" does not exist`);
                    const state = await DRX.resolve(source, read, url);
                    const name = state.app.name;
                    if (state.app.type !== 'library') throw new Error(`Document with url "${url}" is not a library`);
                    if (!name) throw new Error(`Library with url "${url}" has no name`);
                    if (libraries[name]) throw new Error(`Library with name "${name}" is already loaded from url "${libraries[name].url}"`);
                    libraries[name] = { url, state };
                    await visit(state.app.libraries);
                } catch (error) {
                    console.error(`Failed to load library with url "${url}"`, error);
                }
            }
        };
        await visit(document.state.value.app.libraries);
        document.state.set(state => Object.values(libraries).reduce((linked, library) => DrxDocumentState.link(linked, library.state, library.url), DrxDocumentState.unlink(state)));
    }

    private static async fetch(path: string): Promise<Uint8Array | undefined> {
        const response = await fetch(path);
        return response.ok ? new Uint8Array(await response.arrayBuffer()) : undefined;
    }

    private static async readText(data: string | Uint8Array<ArrayBufferLike>): Promise<string | undefined> {
        return data instanceof Uint8Array ? new TextDecoder().decode(data) : data;
    }

    private static async resolve(drx: string, read: DrxImport, url?: string): Promise<DrxDocumentState> {
        const resolveImports = async (drx: string, base: string): Promise<Document> => {
            const dom = new DOMParser().parseFromString(drx, 'text/html');
            for (const element of Array.from(dom.body.querySelectorAll('x-import'))) {
                const src = DrxDom.getRequiredAttribute(element, 'src');
                const path = $Path.join(base, src);
                const data = await read(DrxDocument.locate(path, url));
                const content = await DRX.readText(data) ?? '';
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
                    const nested = await resolveImports(content, path.includes('/') ? $Path.getDirectory(path) : '');
                    element.replaceWith(...Array.from(nested.body.childNodes));
                }
            }
            for (const element of Array.from(dom.body.children)) {
                if (!element.hasAttribute('x-base')) element.setAttribute('x-base', base);
            }
            return dom;
        };
        const dom = await resolveImports(drx, '');
        const namespace = url ? `${dom.body.querySelector(`:scope > ${NodeType.Library}`)?.getAttribute('name') ?? ''}:` : '';
        const state = DrxDom.withNamespace(namespace, () => DRX.from(dom));
        for (const path of Object.values(state.assets).map(asset => DrxAsset.getFilePath(asset)).filter(path => path !== undefined)) {
            try {
                const content = await read(DrxDocument.locate(path, url));
                if (content !== undefined) state.files[DrxDocument.locate(path, url)] = DrxAsset.createUrl(content, $MimeType.fromPath(path));
            } catch {
                continue;
            }
        }
        return state;
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
        const getServiceScriptEntries = (owner: DrxApp | DrxLibrary, serviceIds: string[]) => {
            for (const serviceId of serviceIds) {
                const service = state.services[serviceId];
                if (service.script?.trim()) entries.push({ id: service.id, path: `script://services/${service.name}-${service.id}.ts`, content: service.script, packages: owner.packages, dependencyTree: owner.dependencyTree });
            }
        };
        const getComponentScriptEntries = (owner: DrxApp | DrxLibrary, componentId: string) => {
            const component = state.components[componentId];
            if (component.script?.trim()) entries.push({ id: component.id, path: `script://components/${component.name}-${component.id}.ts`, content: component.script, packages: owner.packages, dependencyTree: owner.dependencyTree });
            getServiceScriptEntries(owner, component.serviceIds);
            for (const childId of component.componentIds) getComponentScriptEntries(owner, childId);
        };
        for (const owner of [app, ...Object.values(state.libraries)]) {
            getServiceScriptEntries(owner, owner.serviceIds);
            for (const componentId of owner.componentIds) getComponentScriptEntries(owner, componentId);
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
        const state = $Value.clone({ ...document.state.value, files: {} });
        const [bundle, icons, runtime] = await Promise.all([
            DRX.bundle(document),
            fetch(DrxIconSheet.url).then(response => response.text()),
            fetch(`${runtimeUrl}/runtime.js`).then(response => response.text())
        ]);
        const files: { path: string; data: Uint8Array; contentType: string }[] = [];
        const text = (path: string, contentType: string, content: string) => ({ path, contentType, data: new TextEncoder().encode(content) });
        await Promise.all(Object.values(state.assets).map(async asset => {
            if (asset.source.type !== 'external') return;
            const filePath = DrxAsset.getFilePath(asset);
            const url = filePath ? document.getFileUrl(filePath, asset.library) : asset.source.url;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to download asset with name "${asset.name}" from url "${url}": ${response.status} ${response.statusText}`);
            const path = `assets/${asset.id}`;
            files.push({ path, data: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get('content-type') ?? 'application/octet-stream' });
            state.assets[asset.id] = { ...asset, source: { type: 'external', url: path } };
        }));
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
            text('app.json', 'application/json', JSON.stringify(state)),
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
        return new DrxDocument(DRX.from(new DOMParser().parseFromString(drx, 'text/html')));
    }

    private static from(dom: Document): DrxDocumentState {
        const state = DrxDocumentState.new();
        return $Object.removeUndefinedProperties({
            ...state,
            app: DrxApp.parse(dom.body.querySelector(`:scope > ${NodeType.App}, :scope > ${NodeType.Library}`), state)
        });
    }

}
