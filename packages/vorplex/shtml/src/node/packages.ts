import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';

export const ShtmlPackages = {
    from(parent: Element): Record<string, string> | undefined {
        const element = ShtmlDom.getNode(parent, NodeType.Packages);
        return element ? ShtmlPackages.parse(element) : undefined;
    },
    parse(element: Element): Record<string, string> {
        return ShtmlDom.getJsonContent(element);
    },
    to(packages: Record<string, string>): Element {
        const element = document.createElement(NodeType.Packages);
        ShtmlDom.setJsonContent(element, packages);
        return element;
    }
};
