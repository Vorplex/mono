import { $Id, Scope, Signal } from '@vorplex/core';
import { ExpressionParser } from '../expression-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';
import { DrxPage } from './page';
import { DrxTemplateItem } from './template-item';

export interface DrxPageContainer {
    id: string;
    type: NodeType.PageContainer;
    page: string;
}

export const DrxPageContainer = {
    from(parent: Element, state: DrxDocumentState): DrxTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.PageContainer}`));
        return elements.map(element => DrxPageContainer.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxTemplateItem {
        const item: DrxPageContainer = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.PageContainer,
            page: DrxDom.getRequiredAttribute(element, 'page')
        };
        state.pageContainers[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: DrxPageContainer): Element {
        const element = document.createElement(NodeType.PageContainer);
        DrxDom.setAttribute(element, 'id', item.id);
        DrxDom.setAttribute(element, 'page', item.page);
        return element;
    },
    mount(container: Node, item: DrxPageContainer, context: RenderContext): Scope {
        return Signal.scope(() => {
            ExpressionParser.bind(item.page, context.locals, pageName => {
                const appContext = context.nearest.app!;
                const page = appContext.app.pageIds.map(id => appContext.state.pages[id]).find(page => page.name === pageName);
                if (!page) throw new Error(`Unknown page "${pageName}"`);
                DrxPage.mount(container, page, context);
            });
        });
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.PageContainer);
        host.style.display = 'contents';
        container.appendChild(host);
        Signal.effect(() => {
            const name = context.root.proxy.pageContainers[id].page();
            const pages = context.root.proxy.pages();
            const page = context.root.proxy.app.pageIds().map(pageId => pages[pageId]).find(page => page.name === name);
            if (!page) return;
            DrxPage.preview(host, page.id, context);
        });
        Signal.cleanup(() => host.remove());
        return host;
    }
};
