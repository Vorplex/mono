import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';
import { DrxTemplate, DrxTemplateItem } from './template-item';
import { DrxVariable } from './variable';

export interface DrxPage {
    id: string;
    name: string;
    script?: string;
    style?: string;
    variableIds: string[];
    template: DrxTemplateItem[];
}

export const DrxPage = class {

    public static parse(element: Element, state: DrxDocumentState): DrxPage {
        const variables = DrxDom.parseChildren(element, NodeType.Variable, child => DrxVariable.parse(child, state));
        const page: DrxPage = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            script: DrxDom.getScript(element),
            style: DrxDom.getStyle(element),
            variableIds: variables.map(variable => variable.id),
            template: DrxTemplate.parse(element, state)
        };
        state.pages[page.id] = page;
        return page;
    }

    public static to(page: DrxPage, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Page);
        DrxDom.setAttribute(element, 'id', page.id);
        DrxDom.setAttribute(element, 'name', page.name);
        DrxDom.createScript(element, page.script);
        DrxDom.createStyle(element, page.style);
        for (const id of page.variableIds) element.appendChild(DrxVariable.to(state.variables[id]));
        for (const child of DrxTemplate.to(page.template, state)) element.appendChild(child);
        return element;
    }

    public static children(page: DrxPage): DrxTemplateItem[] {
        return [
            ...page.variableIds.map(id => ({ type: NodeType.Variable, id })),
            ...page.template
        ];
    }

}
