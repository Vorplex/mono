import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';

export const DrxPackages = {
    from(parent: Element): Record<string, string> | undefined {
        const element = DrxDom.getNode(parent, NodeType.Packages);
        return element ? DrxPackages.parse(element) : undefined;
    },
    parse(element: Element): Record<string, string> {
        return DrxDom.getJsonContent(element);
    },
    to(packages: Record<string, string>): Element {
        const element = document.createElement(NodeType.Packages);
        DrxDom.setJsonContent(element, packages);
        return element;
    }
};
