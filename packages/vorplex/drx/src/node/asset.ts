import { $Id } from '@vorplex/core';
import { DrxDocumentState } from '../drx';
import { DrxDom } from '../drx-dom';
import { NodeType } from './node-type';

export type DrxAssetSource =
    | { type: 'external'; url: string }
    | { type: 'internal'; content: string; mimeType?: string };

export interface DrxAsset {
    id: string;
    name: string;
    source: DrxAssetSource;
}

const resolvedUrls = new Map<string, string>();

export const DrxAsset = {
    from(parent: Element, state: DrxDocumentState): DrxAsset[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Asset}`));
        return elements.map(element => DrxAsset.parse(element, state));
    },
    parse(element: Element, state: DrxDocumentState): DrxAsset {
        const url = DrxDom.getAttribute(element, 'src');
        const asset: DrxAsset = {
            id: DrxDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: DrxDom.getRequiredAttribute(element, 'name'),
            source: url
                ? { type: 'external', url }
                : { type: 'internal', content: DrxDom.getContent(element), mimeType: DrxDom.getAttribute(element, 'type') }
        };
        state.assets[asset.id] = asset;
        return asset;
    },
    to(asset: DrxAsset): Element {
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
    },
    resolveUrl(asset: DrxAsset): string {
        if (asset.source.type === 'external') return asset.source.url;
        if (!resolvedUrls.has(asset.id)) {
            const url = URL.createObjectURL(new Blob([asset.source.content ?? ''], { type: asset.source.mimeType ?? 'application/octet-stream' }));
            resolvedUrls.set(asset.id, url);
        }
        return resolvedUrls.get(asset.id);
    },
    toLocal(assetIds: string[], state: DrxDocumentState): Record<string, string> {
        const assets = assetIds.map(id => state.assets[id]);
        return new Proxy({} as Record<string, string>, {
            get: (_, name) => {
                if (typeof name !== 'string') return undefined;
                const asset = assets.find(asset => asset.name === name);
                return asset ? DrxAsset.resolveUrl(asset) : undefined;
            }
        });
    }
};
