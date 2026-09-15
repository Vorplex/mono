import { DependencyTree } from '@vorplex/compiler';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';

export const DrxDependencyTree = {
    from(parent: Element): DependencyTree | undefined {
        const element = DrxDom.getNode(parent, NodeType.DependencyTree);
        return element ? DrxDependencyTree.parse(element) : undefined;
    },
    parse(element: Element): DependencyTree {
        return DrxDom.getJsonContent(element);
    },
    to(dependencyTree: DependencyTree): Element {
        const element = document.createElement(NodeType.DependencyTree);
        DrxDom.setJsonContent(element, dependencyTree);
        return element;
    }
};
