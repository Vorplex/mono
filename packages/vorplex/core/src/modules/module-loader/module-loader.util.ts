export class ModuleLoader {
    public static resolver?: (namespace: string) => any;

    public static evaluate(code: string, context: Record<string, any> = {}, realm: typeof globalThis = globalThis): Record<string, any> {
        if (!code) return null;
        const func = new realm.Function('context', 'module', `with (context) {${code}}`);
        const module: { exports: Record<string, any> } = { exports: {} };
        const require = (namespace: string) => ModuleLoader.require(namespace);
        const define = (deps: string[], factory: (...deps: any[]) => void) => {
            factory(require, module.exports);
        };
        func.call(context, { require, define, exports: module.exports, ...context }, module);
        return module.exports;
    }

    public static async evaluateAsync(code: string, context: Record<string, any> = {}, realm: typeof globalThis = globalThis): Promise<Record<string, any>> {
        code = `return (async function() {${code}})();`;
        return ModuleLoader.evaluate(code, context, realm);
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

    public static require(namespace: string): any {
        const module = ModuleLoader.resolver?.(namespace);
        if (module === undefined) throw new Error(`No package was registered for import "${namespace}"`);
        return module;
    }
}
