import type { DependencyTree } from '@vorplex/compiler';
import type { DrxDocumentState, DrxScope } from '../document';
import { DrxDom } from '../dom';
import type { DrxApp } from './app/app';
import { NodeType } from './node-type';

export interface DrxLibrary {
    id: string;
    url: string;
    libraries?: string[];
    packages?: Record<string, string>;
    dependencyTree?: DependencyTree;
    variableIds: string[];
    serviceIds: string[];
    assetIds: string[];
    componentIds: string[];
    typeIds: string[];
    apiIds: string[];
}

export const DrxLibraries = class {

    public static parse(element: Element): string[] {
        return DrxDom.getJsonContent(element);
    }

    public static to(libraries: string[]): Element {
        const element = document.createElement(NodeType.Libraries);
        DrxDom.setJsonContent(element, libraries);
        return element;
    }

    public static getEntryUrl(url: string): string {
        try {
            const resolved = new URL(url);
            if (!/\.html?$/i.test(resolved.pathname)) resolved.pathname = `${resolved.pathname.replace(/\/?$/, '/')}index.html`;
            return resolved.href;
        } catch {
            return url;
        }
    }

    public static getNamespace(reference: string): { namespace?: string, resource: string } {
        const separator = reference?.indexOf('.') ?? -1;
        return separator === -1 ? { resource: reference } : { namespace: reference.slice(0, separator), resource: reference.slice(separator + 1) };
    }

    public static getOwner(state: DrxDocumentState, scope: DrxScope): DrxApp | DrxLibrary {
        const library = scope.type === 'library' ? scope.library : scope.type === 'component' ? state.components[scope.componentId].library : undefined;
        return library ? state.libraries[library] : state.app;
    }

    public static getLinked(state: DrxDocumentState, owner: DrxApp | DrxLibrary): DrxLibrary[] {
        const urls = (owner.libraries ?? []).map(url => DrxLibraries.getEntryUrl(url));
        return Object
            .values(state.libraries)
            .filter(library => urls.includes(library.url));
    }

    public static resolveReference(state: DrxDocumentState, scope: DrxScope, reference: string): { scope: DrxScope; name: string } | undefined {
        const { namespace, resource } = DrxLibraries.getNamespace(reference);
        if (namespace === undefined) return { scope, name: resource };
        const library = DrxLibraries
            .getLinked(state, DrxLibraries.getOwner(state, scope))
            .find(library => library.id === namespace);
        if (!library) return;
        return { scope: { type: 'library', library: library.id }, name: resource };
    }

}
