import { $Id, $Path, $Url } from '@vorplex/core';
import { DrxDom } from '../dom';
import type { DrxDocumentState } from '../document';
import { NodeType } from './node-type';

export type DrxAssetSource =
    | { type: 'external'; url: string }
    | { type: 'inline'; content: string; mimeType?: string };

export interface DrxAsset {
    id: string;
    name: string;
    source: DrxAssetSource;
}

class DrxAssetClass {

    private static readonly urls = new Map<string, string>();

    public static isFileSource(src: string): boolean {
        return !!src && !$Url.isAbsolute(src) && !/^[/#?]/.test(src) && !src.includes('{{');
    }

    public static getFilePath(asset: DrxAsset): string | undefined {
        if (asset?.source.type !== 'external' || !DrxAsset.isFileSource(asset.source.url)) return undefined;
        return asset.source.url;
    }

    public static getTargetPath(asset: DrxAsset): string | undefined {
        const path = DrxAsset.getFilePath(asset);
        return path && `assets/${asset.id}${$Path.getExtension(path) ?? ''}`;
    }

    public static createUrl(content: string | Uint8Array, mimeType: string): string {
        const key = `${mimeType}:${$Id.hash(typeof content === 'string' ? content : new TextDecoder('latin1').decode(content))}`;
        if (!DrxAsset.urls.has(key)) DrxAsset.urls.set(key, URL.createObjectURL(new Blob([content as BlobPart], { type: mimeType })));
        return DrxAsset.urls.get(key);
    }

    public static parse(element: Element, state: DrxDocumentState): DrxAsset {
        const src = DrxDom.getAttribute(element, 'src');
        const asset: DrxAsset = {
            id: DrxDom.getId(element),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            source: src
                ? {
                    type: 'external',
                    url: DrxAsset.isFileSource(src) ? DrxDom.resolvePath(element, src) : src
                }
                : {
                    type: 'inline',
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
