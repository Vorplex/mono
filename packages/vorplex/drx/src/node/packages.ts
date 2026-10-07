import { DrxDom } from '../dom';
import { NodeType } from './node-type';

export const DrxPackages = class {

    public static parse(element: Element): Record<string, string> {
        return DrxDom.getJsonContent(element);
    }

    public static to(packages: Record<string, string>): Element {
        const element = document.createElement(NodeType.Packages);
        DrxDom.setJsonContent(element, packages);
        return element;
    }

}
