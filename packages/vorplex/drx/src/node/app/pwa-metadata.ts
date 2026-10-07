import { DrxDom } from '../../dom';
import { NodeType } from '../node-type';

export interface DrxPwaIcon {
    src: string;
    sizes?: string;
    type?: string;
    purpose?: string;
}

export interface DrxPwaMetadata {
    name: string;
    short_name?: string;
    description?: string;
    theme_color?: string;
    background_color?: string;
    display?: string;
    icons: DrxPwaIcon[];
}

export const DrxPwaMetadata = class {

    public static parse(element: Element): DrxPwaMetadata {
        return DrxDom.getJsonContent(element);
    }

    public static to(pwa: DrxPwaMetadata): Element {
        const element = document.createElement(NodeType.PwaMetadata);
        DrxDom.setJsonContent(element, pwa);
        return element;
    }

}
