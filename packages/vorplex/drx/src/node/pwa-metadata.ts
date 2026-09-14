import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';

export interface DrxPwaIcon {
    src: string;
    sizes?: string;
    type?: string;
    purpose?: string;
}

export interface DrxPwaMetadata {
    name: string;
    shortName?: string;
    description?: string;
    themeColor?: string;
    backgroundColor?: string;
    display?: string;
    icons: DrxPwaIcon[];
}

export const DrxPwaMetadata = {
    from(parent: Element): DrxPwaMetadata | undefined {
        const element = DrxDom.getNode(parent, NodeType.PwaMetadata);
        return element ? DrxPwaMetadata.parse(element) : undefined;
    },
    parse(element: Element): DrxPwaMetadata {
        return DrxDom.getJsonContent(element);
    },
    to(pwa: DrxPwaMetadata): Element {
        const element = document.createElement(NodeType.PwaMetadata);
        DrxDom.setJsonContent(element, pwa);
        return element;
    }
};
