import { $String, ModuleLoader } from '@vorplex/core';
import { maxSatisfying } from 'semver';
import { NPM } from '../npm/npm.util';

export class ModuleRegistry {
    public static registry: Record<string, Record<string, any>> = {};

    public static resolve(namespace: string): any {
        const string = NPM.parseImportString(namespace);
        const versions = ModuleRegistry.registry[string.name];
        if (!versions) return undefined;
        const version = versions[string.version] ?? versions['latest'] ?? versions[maxSatisfying(Object.keys(versions), '*')] ?? versions['<default>'];
        const subpath = string.path ? `${$String.toAlphanumeric(string.name, '_')}__${$String.toAlphanumeric(string.path, '_')}` : null;
        if (!version) return undefined;
        return subpath ? version[subpath] : version;
    }

    public static registerModule(name: string, version: string, module: any) {
        ModuleRegistry.registry[name] = Object.assign({}, ModuleRegistry.registry[name], { [version]: module });
        ModuleLoader.resolver ??= namespace => ModuleRegistry.resolve(namespace);
    }

    public static registerBundle(name: string, version: string, bundle: string) {
        const module = ModuleLoader.evaluate(bundle);
        ModuleRegistry.registerModule(name, version, module);
    }
}
