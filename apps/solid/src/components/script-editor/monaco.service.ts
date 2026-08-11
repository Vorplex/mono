import { JsDelivr, type PackageJson } from '@vorplex/compiler';
import { $Path, $PathSelector, Injectable, State } from '@vorplex/core';
import * as monaco from 'monaco-editor';
import { type IDisposable } from 'monaco-editor';
import { createMemo } from 'solid-js';
import { isMap, isSeq, parseDocument } from 'yaml';
import { DarkTheme, Theme } from '../../consts/theme';

self.MonacoEnvironment = {
    getWorkerUrl: (_moduleId: string, label: string) => {
        if (label === 'json') return 'assets/monaco-editor/esm/vs/languages/features/json/json.worker.js';
        if (label === 'css') return 'assets/monaco-editor/esm/vs/languages/features/css/css.worker.js';
        if (label === 'html') return 'assets/monaco-editor/esm/vs/languages/features/html/html.worker.js';
        if (label === 'typescript' || label === 'javascript') return 'assets/monaco-editor/esm/vs/languages/features/typescript/ts.worker.js';
        return 'assets/monaco-editor/esm/vs/editor/editor.worker.js';
    },
};

@Injectable({ global: true })
export class MonacoService {
    private snippets: Record<string, { text: string; documentation?: string }> = {};

    private readonly initialized = new State<undefined | 'initializing' | 'initialized'>();

    public async init() {
        if (this.initialized.value === 'initialized') return;
        else if (this.initialized.value === 'initializing') return await this.initialized.until((state) => state.value === 'initialized');
        this.initialized.update('initializing');
        createMemo(() => {
            const theme = Theme();
            const name = 'custom';
            monaco.editor.defineTheme(name, {
                base: theme === DarkTheme ? 'vs-dark' : 'vs',
                inherit: true,
                rules: [],
                colors: { 'editor.background': theme.background.color },
            });
            monaco.editor.setTheme(name);
        });
        monaco.typescript.typescriptDefaults.setCompilerOptions({
            baseUrl: 'file:///',
            module: monaco.typescript.ModuleKind.ESNext,
            target: monaco.typescript.ScriptTarget.ES2020,
            moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
            allowNonTsExtensions: true,
        });
        monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
            diagnosticCodesToIgnore: [1108] // Ignore "A 'return' statement can only be used within a function body"
        });
        monaco.languages.registerCompletionItemProvider(['typescript', 'javascript'], {
            provideCompletionItems: (_model, position) => {
                const suggestions: monaco.languages.CompletionItem[] = Object.entries(this.snippets).map(([label, snippet]) => ({
                    label: label,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: snippet.text,
                    documentation: snippet.documentation,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    },
                }));

                return { suggestions };
            },
        });
        this.initialized.update('initialized');
    }

    public buildMonacoYamlErrorMarkers(yamlText: string, errors: { path: string; message: string }[]): monaco.editor.IMarkerData[] {
        const resolvePathOffset = (yamlText: string, segments: string[]): number => {
            const doc = parseDocument(yamlText);
            let current: any = doc.contents;
            let lastKnownOffset = current?.range?.[0] ?? -1;
            for (let i = 0; i < segments.length; i++) {
                if (current == null) return lastKnownOffset;
                const segment = segments[i];
                if (isMap(current)) {
                    const pair: any = current.items.find((p: any) => String(p.key?.value) === segment);
                    if (!pair) return lastKnownOffset;
                    if (i === segments.length - 1) return pair.key?.range?.[0] ?? lastKnownOffset;
                    lastKnownOffset = pair.key?.range?.[0] ?? lastKnownOffset;
                    current = pair.value;
                } else if (isSeq(current)) {
                    const idx = parseInt(segment, 10);
                    const item: any = current.items[idx];
                    if (item == null) return lastKnownOffset;
                    if (i === segments.length - 1) return item?.range?.[0] ?? lastKnownOffset;
                    lastKnownOffset = item?.range?.[0] ?? lastKnownOffset;
                    current = item;
                } else {
                    return lastKnownOffset;
                }
            }
            return current?.range?.[0] ?? lastKnownOffset;
        };
        const lines = yamlText.split('\n');
        return errors.flatMap(error => {
            const segments = $PathSelector.parse(error.path);
            const offset = resolvePathOffset(yamlText, segments);
            if (offset < 0) return [];
            const before = yamlText.substring(0, offset);
            const beforeLines = before.split('\n');
            const lineNumber = beforeLines.length;
            const startColumn = beforeLines[beforeLines.length - 1].length + 1;
            const lineContent = lines[lineNumber - 1] ?? '';
            const marker = {
                startLineNumber: lineNumber,
                startColumn,
                endLineNumber: lineNumber,
                endColumn: lineContent.trimEnd().length + 1,
                message: error.message,
                source: error.path,
                severity: monaco.MarkerSeverity.Error,
            };
            return [marker];
        });
    }

    public registerCompilerPath(module: string, path: string) {
        const currentOptions = monaco.typescript.typescriptDefaults.getCompilerOptions();
        monaco.typescript.typescriptDefaults.setCompilerOptions({
            ...currentOptions,
            paths: {
                ...currentOptions.paths,
                [module]: [...(currentOptions.paths?.[module] ?? []), path],
            },
        });
    }

    public getLibraries() {
        const current = monaco.typescript.typescriptDefaults.getExtraLibs();
        return Object.entries(current).map(([filePath, lib]) => ({ filePath, content: lib.content }));
    }

    public clearLibraries() {
        monaco.typescript.typescriptDefaults.setExtraLibs([]);
    }

    private updateLibrary(uri: string, content: string | null): void {
        const libs = this.getLibraries().filter(definition => definition.filePath !== uri)
        if (content !== null) libs.push({ filePath: uri, content });
        monaco.typescript.typescriptDefaults.setExtraLibs(libs);
    }

    public async setGlobalLibrary(definition: string): Promise<IDisposable> {
        await this.init();
        const uri = 'file:///global.d.ts';
        this.updateLibrary(uri, definition);
        return { dispose: () => this.updateLibrary(uri, null) };
    }

    public async createVirtualModel(uri: string, content: string): Promise<IDisposable> {
        await this.init();
        const monacoUri = monaco.Uri.parse(uri);
        const existing = monaco.editor.getModel(monacoUri);
        if (existing) existing.dispose();
        const model = monaco.editor.createModel(content, 'typescript', monacoUri);
        return { dispose: () => model.dispose() };
    }

    public async loadPackageLibraries(name: string, semanticVersion: string) {
        const version = await JsDelivr.resolveVersion(name, semanticVersion);
        const packageJson = await JsDelivr.getFile(name, version, 'package.json');
        this.updateLibrary(`file:///node_modules/${name}/package.json`, packageJson.content);
        const pack: PackageJson = JSON.parse(packageJson.content);
        if (pack.exports) {
            const exports = pack.exports;
            for (const [exportPath, exportConfig] of Object.entries(exports)) {
                if (typeof exportConfig === 'object' && 'types' in exportConfig && exportConfig.types) {
                    const typesPath = exportConfig.types as string;
                    const regex = new RegExp(`^${$Path.absolute(typesPath).replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
                    const paths = await JsDelivr.getFilePaths(name, version, regex);
                    await Promise.all(
                        paths.map(async (path) => {
                            const file = await JsDelivr.getFile(name, version, path);
                            const uri = `file:///node_modules/${name}/${path}`;
                            this.updateLibrary(uri, file.content);
                            const definitionPath = $Path.join('node_modules', name, path.replace('.d.ts', ''));
                            this.registerCompilerPath($Path.join(name, exportPath), definitionPath);
                            console.log('Registering', 'Module', $Path.join(name, exportPath), 'Path', definitionPath, uri);
                        }),
                    );
                }
            }
        } else {
            const types = pack.types ?? pack.typings ?? pack.typescript;
            if (types) {
                const definitionPath = $Path.join('node_modules', name, types.replace('.d.ts', ''));
                this.registerCompilerPath(name.replace('@types/', ''), definitionPath);
                const paths = await JsDelivr.getFilePaths(name, version, /^package\.json$|\.d\.ts$/);
                await Promise.all(
                    paths.map(async (path) => {
                        const file = await JsDelivr.getFile(name, version, path);
                        this.updateLibrary(`file:///node_modules/${name}/${path}`, file.content);
                    }),
                );
            } else {
                try {
                    await this.loadPackageLibraries(`@types/${name}`, semanticVersion);
                } catch { }
            }
        }
    }

    public registerSnippet(label: string, insertText: string, documentation?: string): void {
        this.snippets[label] = { text: insertText, documentation };
    }
}
