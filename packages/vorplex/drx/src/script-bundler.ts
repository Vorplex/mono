import { Compiler, JsDelivr, NPM, type DependencyTree } from '@vorplex/compiler';
import { DrxDocumentState } from './drx';

export const DrxScriptBundler = {
    async bundle(state: DrxDocumentState): Promise<string> {
        const entries: {
            id: string;
            content: string;
            packages?: Record<string, string>;
            dependencyTree?: DependencyTree;
        }[] = [];
        const app = state.app;
        if (app.script?.trim()) entries.push({ id: app.id, content: app.script, packages: app.packages, dependencyTree: app.dependencyTree });
        for (const pageId of app.pageIds) {
            const page = state.pages[pageId];
            if (page.script?.trim()) entries.push({ id: page.id, content: page.script, packages: app.packages, dependencyTree: app.dependencyTree });
        }
        for (const serviceId of app.serviceIds) {
            const service = state.services[serviceId];
            if (service.script?.trim()) entries.push({ id: service.id, content: service.script, packages: app.packages, dependencyTree: app.dependencyTree });
        }
        const getComponentScriptEntries = (componentId: string) => {
            const component = state.components[componentId];
            if (component.script?.trim()) entries.push({ id: component.id, content: component.script, packages: component.packages, dependencyTree: component.dependencyTree });
            for (const serviceId of component.serviceIds) {
                const service = state.services[serviceId];
                if (service.script?.trim()) entries.push({ id: service.id, content: service.script, packages: component.packages, dependencyTree: component.dependencyTree });
            }
            for (const childId of component.componentIds) getComponentScriptEntries(childId);
        };
        for (const componentId of app.componentIds) getComponentScriptEntries(componentId);
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
            files[`script://${entry.id}.ts`] = { content: entry.content, dependencyTree };
        }));
        const entryPath = 'entry.ts';
        files[entryPath] = {
            content: `export default { ${entries.map(entry => `'${entry.id}': require('script://${entry.id}.ts').default`).join(', ')} };`
        };
        return await Compiler.compile({ files, entryFilePath: entryPath });
    }
};
