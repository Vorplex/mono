import { $Tson, MapAdaptor, TsonDefinition } from '@vorplex/core';
import { DrxDom } from '../dom';
import type { DrxDocumentState, DrxScope } from '../document';
import { NodeType } from './node-type';

export interface DrxType {
    id: string;
    name: string;
    type: TsonDefinition;
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

    public static resolve(scope: DrxScope, name: string, state: DrxDocumentState): TsonDefinition {
        const defaultTypeName = name as TsonDefinition['type'];
        if ($Tson.definitions.includes(defaultTypeName)) return $Tson.getDefaultDefinition(defaultTypeName);
        const owner = scope.type === 'app' ? state.app : state.components[scope.componentId];
        const types = MapAdaptor.fromArray(owner.typeIds.map(id => state.types[id]), record => [record.name, record.type]);
        const resolved = types[name];
        if (!resolved) return $Tson.any();
        return $Tson.resolveRefs(resolved, refName => DrxType.resolve(scope, refName, state));
    }

}
