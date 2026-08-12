import { $Id, Scope, Signal } from '@vorplex/core';
import { BindingParser } from '../binding-parser';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';
import { ShtmlPage } from './page';
import { ShtmlTemplateItem } from './template-item';

export interface ShtmlPageContainer {
    id: string;
    type: NodeType.PageContainer;
    page: string;
}

export const ShtmlPageContainer = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.PageContainer}`));
        return elements.map(element => ShtmlPageContainer.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlTemplateItem {
        const item: ShtmlPageContainer = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.PageContainer,
            page: ShtmlDom.getRequiredAttribute(element, 'page')
        };
        state.pageContainers[item.id] = item;
        return { id: item.id, kind: item.type };
    },
    to(item: ShtmlPageContainer): Element {
        const element = document.createElement(NodeType.PageContainer);
        element.setAttribute('id', item.id);
        element.setAttribute('page', item.page);
        return element;
    },
    mount(container: Node, item: ShtmlPageContainer, context: RenderContext): Scope {
        return Signal.scope(() => {
            BindingParser.bind(item.page, context.locals, pageName => {
                const appContext = context.nearest.app!;
                const page = appContext.app.pageIds.map(id => appContext.state.pages[id]).find(page => page.name === pageName);
                if (!page) throw new Error(`Unknown page "${pageName}"`);
                ShtmlPage.mount(container, page, context);
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
            ShtmlPage.preview(host, page.id, context);
        });
        Signal.cleanup(() => host.remove());
        return host;
    }
};
