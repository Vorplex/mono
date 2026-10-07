import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';

export interface DrxVariable {
    id: string;
    name: string;
    type: string;
    value?: any;
}

export const DrxVariable = class {

    public static parse(element: Element, state: DrxDocumentState): DrxVariable {
        const variable: DrxVariable = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            type: DrxDom.getAttribute(element, 'type') ?? 'any',
            value: DrxDom.getJsonContent(element)
        };
        state.variables[variable.id] = variable;
        return variable;
    }

    public static to(variable: DrxVariable): Element {
        const element = document.createElement(NodeType.Variable);
        DrxDom.setAttribute(element, 'id', variable.id);
        DrxDom.setAttribute(element, 'name', variable.name);
        DrxDom.setAttribute(element, 'type', variable.type);
        if (variable.value != null) DrxDom.setJsonContent(element, variable.value);
        return element;
    }

}
