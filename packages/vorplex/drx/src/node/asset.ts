import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';

export type DrxAssetSource =
    | { type: 'external'; url: string }
    | { type: 'internal'; content: string; mimeType?: string };

export interface DrxAsset {
    id: string;
    name: string;
    source: DrxAssetSource;
}

class DrxAssetClass {

    private static readonly resolvedUrls = new Map<string, string>();
    public static parse(element: Element, state: DrxDocumentState): DrxAsset {
        const url = DrxDom.getAttribute(element, 'src');
        const asset: DrxAsset = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            source: url
                ? {
                    type: 'external',
                    url
                }
                : {
                    type: 'internal',
                    content: DrxDom.getContent(element),
                    mimeType: DrxDom.getAttribute(element, 'type')
                }
        };
        state.assets[asset.id] = asset;
        return asset;
    }

    public static to(asset: DrxAsset): Element {
        const element = document.createElement(NodeType.Asset);
        DrxDom.setAttribute(element, 'id', asset.id);
        DrxDom.setAttribute(element, 'name', asset.name);
        if (asset.source.type === 'external') {
            DrxDom.setAttribute(element, 'src', asset.source.url);
        } else {
            if (asset.source.mimeType) DrxDom.setAttribute(element, 'type', asset.source.mimeType);
            if (asset.source.content) element.innerHTML = asset.source.content;
        }
        return element;
    }

}

export const DrxAsset = DrxAssetClass;
