import { DependencyTree } from '@vorplex/compiler';
import { DrxDom } from '../dom';
import { NodeType } from './node-type';

export const DrxDependencyTree = class {

    public static parse(element: Element): DependencyTree {
        return DrxDom.getJsonContent(element);
    }

    public static to(dependencyTree: DependencyTree): Element {
        const element = document.createElement(NodeType.DependencyTree);
        DrxDom.setJsonContent(element, dependencyTree);
        return element;
    }

}
