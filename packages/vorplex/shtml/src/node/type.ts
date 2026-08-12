import { $Id, $Tson, TsonDefinition } from '@vorplex/core';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';

export interface ShtmlType {
    id: string;
    name: string;
    type: TsonDefinition;
}

export const ShtmlType = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlType[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Type}`));
        return elements.map(element => ShtmlType.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlType {
        const type: ShtmlType = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            type: ShtmlDom.getJsonContent(element)
        };
        state.types[type.id] = type;
        return type;
    },
    to(type: ShtmlType): Element {
        const element = document.createElement(NodeType.Type);
        element.setAttribute('id', type.id);
        element.setAttribute('name', type.name);
        ShtmlDom.setJsonContent(element, type.type);
        return element;
    },
    resolve(name: string, types: ShtmlType[]): TsonDefinition {
        const defaultTypeName = name as TsonDefinition['type'];
        if ($Tson.definitions.includes(defaultTypeName)) return $Tson.getDefaultDefinition(defaultTypeName);
        return types.find(type => type.name === name)?.type ?? $Tson.any();
    }
};
