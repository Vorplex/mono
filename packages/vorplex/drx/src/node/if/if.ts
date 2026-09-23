import { $Id, Scope, Signal } from '@vorplex/core';
import { DrxDocumentState } from '../../drx';
import { DrxDom } from '../../drx-dom';
import { DrxExpressionParser } from '../../expression-parser';
import { PreviewContext } from '../../preview-context';
import { RenderContext } from '../../render-context';
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

export const DrxIf = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.If}`));
        return elements.map(element => DrxIf.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxIf = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.If,
            condition: DrxDom.getRequiredAttribute(element, 'condition'),
            template: DrxTemplate.from(element, state),
            branchIds: DrxElseIf
                .from(element, state)
                .map(branch => branch.id),
            elseId: DrxElse.from(element, state)?.id
        };
        state.ifs[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: DrxIf, state: DrxDocumentState): Element {
        const element = document.createElement(NodeType.If);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'condition', item.condition);
        for (const child of DrxTemplate.to(item.template, state)) element.appendChild(child);
        for (const branchId of item.branchIds) element.appendChild(DrxElseIf.to(state.elseIfs[branchId], state));
        if (item.elseId) element.appendChild(DrxElse.to(state.elses[item.elseId], state));
        return element;
    },
    mount(container: Node, item: DrxIf, context: RenderContext): void {
        const host = document.createElement(NodeType.If);
        host.style.display = 'contents';
        container.appendChild(host);
        const branches: { condition?: string; template: DrxTemplateItem[] }[] = [
            { condition: item.condition, template: item.template },
            ...item.branchIds.map(branchId => context.state.elseIfs[branchId]),
            ...(item.elseId ? [{ template: context.state.elses[item.elseId].template }] : [])
        ];
        let activeBranchTemplate: DrxTemplateItem[];
        let scope: Scope;
        Signal.effect(() => {
            let trueBranchTemplate: DrxTemplateItem[];
            for (const branch of branches) {
                if (!branch.condition || DrxExpressionParser.evaluate(branch.condition, context.locals)) {
                    trueBranchTemplate = branch.template;
                    break;
                }
            }
            activeBranchTemplate = trueBranchTemplate;
            scope?.dispose();
            scope = trueBranchTemplate ? Signal.root(() => DrxTemplate.mount(host, trueBranchTemplate, context)) : undefined;
        });
        Signal.cleanup(() => {
            scope?.dispose();
            host.remove();
        });
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.If);
        host.style.display = 'contents';
        host.setAttribute('data-drx-id', id);
        container.appendChild(host);
        DrxTemplate.preview(host, () => context.root.proxy.ifs[id].template(), context);
        const entries = Signal.keyed(
            () => {
                const proxy = context.root.proxy.ifs[id];
                const branches: DrxTemplateItem[] = proxy.branchIds().map((branchId: string) => ({ id: branchId, type: NodeType.ElseIf }));
                const elseId = proxy.elseId();
                if (elseId) branches.push({ id: elseId, type: NodeType.Else });
                return branches;
            },
            entry => entry.value.id,
            entry => DrxTemplate.previewItem(host, entry().value, context)
        );
        Signal.effect(() => {
            for (const entry of entries()) host.appendChild(entry);
        });
        Signal.cleanup(() => host.remove());
        return host;
    }
};
