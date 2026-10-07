import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';
import { DrxTemplate, DrxTemplateItem } from '../template-item';
import { DrxElse } from './else';
import { DrxElseIf } from './else-if';

export interface DrxIf {
    id: string;
    type: NodeType.If;
    condition: string;
    template: DrxTemplateItem[];
    branchIds: string[];
    elseId?: string;
}

export const DrxIf = class {

    public static parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxIf = {
            id: DrxDom.getId(element),
            type: NodeType.If,
            condition: DrxDom.getRequiredAttribute(element, 'condition'),
            template: DrxTemplate.parse(element, state),
            branchIds: DrxDom.parseChildren(element, NodeType.ElseIf, child => DrxElseIf.parse(child, state))
                .map(branch => branch.id),
            elseId: DrxDom.parseChildren(element, NodeType.Else, child => DrxElse.parse(child, state))[0]?.id
        };
        state.ifs[item.id] = item;
        return { id: item.id, type: item.type };
    }

    public static to(item: DrxIf, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.If);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'condition', item.condition);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        for (const branchId of item.branchIds) element.appendChild(DrxElseIf.to(state.elseIfs[branchId], state));
        if (item.elseId) element.appendChild(DrxElse.to(state.elses[item.elseId], state));
        return element;
    }

    public static children(item: DrxIf): DrxTemplateItem[] {
        return [
            ...item.template,
            ...item.branchIds.map(id => ({ type: NodeType.ElseIf, id })),
            ...(item.elseId ? [{ type: NodeType.Else, id: item.elseId }] : [])
        ];
    }

}
