import { $Id, Signal } from '@vorplex/core';
import { BindingParser } from '../binding-parser';
import { IconSheet } from '../icon-sheet';
import { PreviewContext } from '../preview-context';
import { RenderContext } from '../render-context';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';
import { ShtmlTemplateItem } from './template-item';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SYMBOL_ATTRIBUTES = ['viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];

export interface ShtmlIcon {
    id: string;
    type: NodeType.Icon;
    name: string;
    attributes: Record<string, string>;
}

export const ShtmlIcon = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlTemplateItem[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Icon}`));
        return elements.map(element => ShtmlIcon.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlTemplateItem {
        const item: ShtmlIcon = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            type: NodeType.Icon,
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            attributes: element.getAttributeNames()
                .filter(name => name !== 'name' && name !== 'id')
                .reduce((attributes, name) => Object.assign(attributes, { [name]: element.getAttribute(name) }), {})
        };
        state.icons[item.id] = item;
        return { id: item.id, type: item.type };
    },
    to(item: ShtmlIcon): Element {
        const element = document.createElement(NodeType.Icon);
        element.setAttribute('id', item.id);
        element.setAttribute('name', item.name);
        for (const [name, value] of Object.entries(item.attributes)) element.setAttribute(name, value);
        return element;
    },
    mount(container: Node, item: ShtmlIcon, context: RenderContext): void {
        const host = document.createElement(NodeType.Icon);
        host.style.display = 'contents';
        container.appendChild(host);
        const svg = document.createElementNS(SVG_NS, 'svg') as unknown as SVGElement;
        BindingParser.bindAttributes(svg, item.attributes, context.locals);
        BindingParser.bind(item.name, context.locals, name => {
            const symbol = name ? IconSheet.get(name) : undefined;
            svg.replaceChildren(...(symbol ? Array.from(symbol.childNodes).map(child => child.cloneNode(true)) : []));
            for (const attribute of SYMBOL_ATTRIBUTES) {
                const value = symbol?.getAttribute(attribute);
                if (value) svg.setAttribute(attribute, value);
                else svg.removeAttribute(attribute);
            }
        });
        host.appendChild(svg);
        Signal.cleanup(() => host.remove());
    },
    preview(container: Node, id: string, context: PreviewContext): Node {
        const host = document.createElement(NodeType.Icon);
        host.style.display = 'contents';
        container.appendChild(host);
        const svg = document.createElementNS(SVG_NS, 'svg') as unknown as SVGElement;
        host.appendChild(svg);
        Signal.effect(() => {
            const name = context.root.proxy.icons[id].name();
            const attributes = context.root.proxy.icons[id].attributes();
            BindingParser.applyPreviewAttributes(svg, attributes, context);
            const symbol = BindingParser.isLiteral(name) && name ? IconSheet.get(name) : undefined;
            svg.replaceChildren(...(symbol ? Array.from(symbol.childNodes).map(child => child.cloneNode(true)) : []));
            for (const attribute of SYMBOL_ATTRIBUTES) {
                const value = symbol?.getAttribute(attribute);
                if (value) svg.setAttribute(attribute, value);
                else svg.removeAttribute(attribute);
            }
        });
        Signal.cleanup(() => host.remove());
        return host;
    }
};
