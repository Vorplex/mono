import { $Id, $Tson, TsonDefinition } from '@vorplex/core';
import { DrxDocumentState, DrxScope } from '../drx';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';

export interface DrxType {
    id: string;
    name: string;
    type: TsonDefinition;
}

export const DrxType = {
    from(parent: Element, state: DrxDocumentState): DrxType[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Type}`));
        return elements.map(element => DrxType.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxType {
        const type: DrxType = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getJsonContent(element)
        };
        state.types[type.id] = type;
        return type;
    },
    to(type: DrxType): Element {
        const element = document.createElement(NodeType.Type);
        element.setAttribute('id', type.id);
        element.setAttribute('name', type.name);
        DrxDom.setJsonContent(element, type.type);
        return element;
    },
    resolve(scope: DrxScope, name: string, state: DrxDocumentState): TsonDefinition {
        const defaultTypeName = name as TsonDefinition['type'];
        if ($Tson.definitions.includes(defaultTypeName)) return $Tson.getDefaultDefinition(defaultTypeName);
        const owner = scope.type === 'app' ? state.app : state.components[scope.componentId];
        const types = [
            ...owner.typeIds,
            ...owner.apiIds.flatMap(id => state.apis[id].typeIds)
        ].map(id => state.types[id]);
        return types.find(type => type.name === name)?.type ?? $Tson.any();
    }
};
