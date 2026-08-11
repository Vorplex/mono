import { $Id, $Tson, TsonDefinition } from '@vorplex/core';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';

export interface ShtmlDefinition {
    id: string;
    name: string;
    definition: TsonDefinition;
}

export const ShtmlDefinition = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlDefinition[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Definition}`));
        return elements.map(element => ShtmlDefinition.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlDefinition {
        const definition: ShtmlDefinition = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            definition: ShtmlDom.getJsonContent(element)
        };
        state.definitions[definition.id] = definition;
        return definition;
    },
    to(definition: ShtmlDefinition): Element {
        const element = document.createElement(NodeType.Definition);
        element.setAttribute('id', definition.id);
        element.setAttribute('name', definition.name);
        ShtmlDom.setJsonContent(element, definition.definition);
        return element;
    },
    resolve(name: string, definitions: ShtmlDefinition[]): TsonDefinition {
        const defaultDefinitionName = name as TsonDefinition['type'];
        if ($Tson.definitions.includes(defaultDefinitionName)) return $Tson.getDefaultDefinition(defaultDefinitionName);
        return definitions.find(definition => definition.name === name)?.definition ?? $Tson.any();
    }
};
