import { $Tson, TsonDefinition } from '@vorplex/core';
import type { DrxDocumentState, DrxScope } from '../document';
import { DrxDom } from '../dom';
import { DrxComponent } from './component/component';
import { DrxLibraries } from './libraries';
import { NodeType } from './node-type';

export interface DrxType {
    id: string;
    name: string;
    type: TsonDefinition;
}

export interface DrxResolvedType {
    type: DrxType;
    scope: DrxScope;
}

export const DrxType = class {

    public static parse(element: Element, state: DrxDocumentState): DrxType {
        const type: DrxType = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getJsonContent(element)
        };
        state.types[type.id] = type;
        return type;
    }

    public static to(type: DrxType): Element {
        const element = document.createElement(NodeType.Type);
        DrxDom.setAttribute(element, 'id', type.id);
        DrxDom.setAttribute(element, 'name', type.name);
        DrxDom.setJsonContent(element, type.type);
        return element;
    }

    public static find(state: DrxDocumentState, scope: DrxScope, name: string): DrxResolvedType | undefined {
        const target = DrxLibraries.resolveReference(state, scope, name);
        if (!target) return undefined;
        const owners = target.scope.type === 'component' ? DrxComponent.getChain(state, target.scope.componentId) : [DrxLibraries.getOwner(state, target.scope)];
        const type = owners.flatMap(owner => owner.typeIds.map(id => state.types[id])).find(type => type?.name === target.name);
        return type && { type, scope: target.scope };
    }

    public static resolve(state: DrxDocumentState, scope: DrxScope, name: string): TsonDefinition {
        const defaultTypeName = name as TsonDefinition['type'];
        if ($Tson.definitions.includes(defaultTypeName)) return $Tson.getDefaultDefinition(defaultTypeName);
        const resolved = DrxType.find(state, scope, name);
        if (!resolved) return $Tson.any();
        return $Tson.resolveRefs(resolved.type.type, refName => DrxType.resolve(state, resolved.scope, refName));
    }

}
