import { $String } from '@vorplex/core';
import { maxSatisfying } from 'semver';
import { NPM } from '../npm/npm.util';

export class ModuleLoader {
    public static resolver?: (namespace: string) => any;
    public static registry: Record<string, Record<string, any>> = {};

    public static evaluate(code: string, context: Record<string, any> = {}): Record<string, any> {
        if (!code) return null;
        const func = new Function('context', 'module', `with (context) {${code}}`);
        const module: { exports: Record<string, any> } = { exports: {} };
        const require = (namespace: string) => ModuleLoader.resolve(namespace);
        const define = (deps: string[], factory: (...deps: any[]) => void) => {
            factory(require, module.exports);
        };
        func.call(context, { require, define, exports: module.exports, ...context }, module);
        return module.exports;
    }

    public static async evaluateAsync(code: string, context: Record<string, any> = {}): Promise<Record<string, any>> {
        code = `return (async function() {${code}})();`;
        return ModuleLoader.evaluate(code, context);
    }

    public static async import(bundle: string): Promise<Record<string, any>> {
        const blob = new Blob([bundle], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        try {
            return await import(url);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    public static resolve(namespace: string) {
        const string = NPM.parseImportString(namespace);
        if (ModuleLoader.resolver) {
            const module = ModuleLoader.resolver(namespace);
            if (module) {
                ModuleLoader.registerModule(string.packageName, string.version ?? '<default>', module);
                return module;
            }
        }
        const versions = ModuleLoader.registry[string.packageName];
        if (versions) {
            if (versions) {
                const version = versions[string.version] ?? versions['latest'] ?? versions[maxSatisfying(Object.keys(versions), '*')] ?? versions['<default>'];
                const subpath = string.subpath ? `${$String.toAlphanumeric(string.packageName, '_')}__${$String.toAlphanumeric(string.subpath, '_')}` : null;
                if (version) return subpath ? version[subpath] : version;
            }
        }
        throw new Error(`No package was registered for import (${namespace})`);
    }

    public static registerModule(name: string, version: string, module: any) {
        ModuleLoader.registry[name] = Object.assign({}, ModuleLoader.registry[name], { [version]: module });
    }

    public static registerBundle(name: string, version: string, bundle: string) {
        const module = ModuleLoader.evaluate(bundle);
        ModuleLoader.registerModule(name, version, module);
    }
}
