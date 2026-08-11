import { Compiler, JsDelivr, ModuleLoader, NPM, type DependencyTree } from '@vorplex/compiler';
import { ShtmlDocumentState } from './shtml';

// Identity only — exists so scripts can write `Shtml.defineApp(shtml => class {...})` naturally.
// The runtime calls the returned factory itself; these never do anything beyond passing the factory through.
export const ScriptRuntimeApi = {
    defineApp: (factory: any) => factory,
    definePage: (factory: any) => factory,
    defineComponent: (factory: any) => factory,
    defineService: (factory: any) => factory
};

export interface CompiledScripts {
    bundle: string;
    keys: Map<string, string>;
}

function scriptKey(id: string): string {
    return `s_${id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

interface ScriptEntry {
    id: string;
    content: string;
    packages?: Record<string, string>;
}

function collectEntries(state: ShtmlDocumentState): ScriptEntry[] {
    const entries: ScriptEntry[] = [];
    const app = state.app;
    if (app.script?.trim()) entries.push({ id: app.id, content: app.script, packages: app.packages });
    for (const pageId of app.pageIds) {
        const page = state.pages[pageId];
        if (page.script?.trim()) entries.push({ id: page.id, content: page.script, packages: app.packages });
    }
    for (const serviceId of app.serviceIds) {
        const service = state.services[serviceId];
        if (service.script?.trim()) entries.push({ id: service.id, content: service.script, packages: app.packages });
    }
    const visitComponent = (componentId: string) => {
        const component = state.components[componentId];
        if (component.script?.trim()) entries.push({ id: component.id, content: component.script, packages: component.packages });
        for (const serviceId of component.serviceIds) {
            const service = state.services[serviceId];
            if (service.script?.trim()) entries.push({ id: service.id, content: service.script, packages: component.packages });
        }
        for (const childId of component.componentIds) visitComponent(childId);
    };
    for (const componentId of app.componentIds) visitComponent(componentId);
    return entries;
}

export const ScriptCompiler = {
    // Compiles every script found in state (app, pages, app-level services, every component and its own
    // services, recursively) into ONE bundle — a synthetic entry file re-exports each script's factory under
    // a stable per-script key. A script's npm dependency tree comes from its owning app/component's OWN
    // `packages` field only (never inherited), matching the <x-packages> scoping rules.
    async compile(state: ShtmlDocumentState): Promise<CompiledScripts> {
        const entries = collectEntries(state);
        if (!entries.length) return { bundle: '', keys: new Map() };

        const dependencyTrees = new Map<Record<string, string>, Promise<DependencyTree>>();
        const resolveTree = (packages?: Record<string, string>): Promise<DependencyTree> => {
            if (!packages) return Promise.resolve({});
            if (!dependencyTrees.has(packages)) dependencyTrees.set(packages, NPM.resolveDependencyTree(packages, JsDelivr));
            return dependencyTrees.get(packages)!;
        };

        const files: Record<string, { content: string; dependencyTree?: DependencyTree }> = {};
        const keys = new Map<string, string>();
        await Promise.all(entries.map(async (entry, index) => {
            const dependencyTree = await resolveTree(entry.packages);
            files[`script-${index}.ts`] = { content: entry.content, dependencyTree };
            keys.set(entry.id, scriptKey(entry.id));
        }));

        const entryPath = 'entry.ts';
        files[entryPath] = {
            content: entries.map((entry, index) => `export { default as ${keys.get(entry.id)} } from './script-${index}.ts';`).join('\n')
        };
        const bundle = await Compiler.compile({ files, entryFilePath: entryPath });
        return { bundle, keys };
    },
    // Evaluates the combined bundle fresh per call (synchronous) — scripts only ever see `Shtml` as a bare
    // global; page/component state is only reachable via the `shtml` parameter passed to the factory.
    instantiate(compiled: CompiledScripts, id: string | undefined, shtml: any): any {
        if (!id || !compiled.keys.has(id)) return undefined;
        const module = ModuleLoader.evaluate(compiled.bundle, { Shtml: ScriptRuntimeApi });
        const factory = module?.[compiled.keys.get(id)!];
        return factory ? factory(shtml) : undefined;
    },
    // Binds a script instance's own methods so they're reachable bare from templates/event handlers.
    bindMethods(instance: any): Record<string, any> {
        if (!instance) return {};
        const prototype = Object.getPrototypeOf(instance);
        return Object
            .getOwnPropertyNames(prototype)
            .filter(name => name !== 'constructor' && typeof instance[name] === 'function')
            .reduce((methods, name) => Object.assign(methods, { [name]: instance[name].bind(instance) }), {});
    },
    // Creates a fresh shtml.services surface for a scope's own declared services, sharing the supplied
    // instances map across the declaring scope. Getters are defined before construction so sibling services
    // can reference each other after instantiation.
    instantiateServices(serviceIds: string[], state: ShtmlDocumentState, compiled: CompiledScripts, instances = new Map<string, any>()): Record<string, any> {
        const api: Record<string, any> = {};
        for (const serviceId of serviceIds) {
            const service = state.services[serviceId];
            Object.defineProperty(api, service.name, { get: () => instances.get(serviceId), enumerable: true });
        }
        for (const serviceId of serviceIds) {
            if (instances.has(serviceId)) continue;
            const service = state.services[serviceId];
            const ServiceClass = ScriptCompiler.instantiate(compiled, service.id, { apis: {}, services: api });
            instances.set(serviceId, ServiceClass ? new ServiceClass() : undefined);
        }
        return api;
    }
};
