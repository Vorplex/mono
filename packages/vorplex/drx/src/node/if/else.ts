import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';

export interface DrxElse {
    id: string;
    template: DrxTemplateItem[];
}

export const DrxElse = class {

    public static parse(element: Element, state: DrxDocumentState): DrxElse {
        const item: DrxElse = {
            id: DrxDom.getId(element),
            template: DrxTemplate.parse(element, state)
        };
        state.elses[item.id] = item;
        return item;
    }

    public static to(item: DrxElse, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.Else);
        DrxDom.setAttribute(element, 'id', item.id);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    }

    public static children(item: DrxElse): DrxTemplateItem[] {
        return item.template;
    }

}
