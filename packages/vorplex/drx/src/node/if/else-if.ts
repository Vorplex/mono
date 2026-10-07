import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';

export interface DrxElseIf {
    id: string;
    condition: string;
    template: DrxTemplateItem[];
}

export const DrxElseIf = class {

    public static parse(element: Element, state: DrxDocumentState): DrxElseIf {
        const item: DrxElseIf = {
            id: DrxDom.getId(element),
            condition: DrxDom.getRequiredAttribute(element, 'condition'),
            template: DrxTemplate.parse(element, state)
        };
        state.elseIfs[item.id] = item;
        return item;
    }

    public static to(item: DrxElseIf, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.ElseIf);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'condition', item.condition);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    }

    public static children(item: DrxElseIf): DrxTemplateItem[] {
        return item.template;
    }

}
