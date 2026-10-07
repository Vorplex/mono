import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';
import { DrxTemplate, DrxTemplateItem } from './template-item';

export interface DrxFor {
    id: string;
    type: NodeType.For;
    each: string;
    as: string;
    index?: string;
    key?: string;
    track?: string;
    template: DrxTemplateItem[];
}

export const DrxFor = class {

    public static parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxFor = {
            id: DrxDom.getId(element),
            type: NodeType.For,
            each: DrxDom.getRequiredAttribute(element, 'each'),
            as: DrxDom.getRequiredAttribute(element, 'as'),
            index: DrxDom.getAttribute(element, 'index'),
            key: DrxDom.getAttribute(element, 'key'),
            track: DrxDom.getAttribute(element, 'track'),
            template: DrxTemplate.parse(element, state)
        };
        state.fors[item.id] = item;
        return { id: item.id, type: item.type };
    }

    public static to(item: DrxFor, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.For);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'each', item.each);
        DrxDom.setAttribute(element, 'as', item.as);
        if (item.index) DrxDom.setAttribute(element, 'index', item.index);
        if (item.key) DrxDom.setAttribute(element, 'key', item.key);
        if (item.track) DrxDom.setAttribute(element, 'track', item.track);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        return element;
    }

    public static children(item: DrxFor): DrxTemplateItem[] {
        return item.template;
    }

}
