import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';

export interface DrxApiParameter {
    id: string;
    name: string;
    required: boolean;
    description?: string;
}

export const DrxApiParameter = class {

    public static parse(element: Element, state: DrxDocumentState): DrxApiParameter {
        const parameter: DrxApiParameter = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            required: DrxDom.getBooleanAttribute(element, 'required'),
            description: DrxDom.getAttribute(element, 'description')
        };
        state.apiParameters[parameter.id] = parameter;
        return parameter;
    }

    public static to(parameter: DrxApiParameter): Element {
        const element = document.createElement(NodeType.ApiParameter);
        DrxDom.setAttribute(element, 'id', parameter.id);
        DrxDom.setAttribute(element, 'name', parameter.name);
        DrxDom.setAttribute(element, 'required', String(parameter.required));
        if (parameter.description) DrxDom.setAttribute(element, 'description', parameter.description);
        return element;
    }

}
