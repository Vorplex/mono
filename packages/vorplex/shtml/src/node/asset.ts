import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';

export interface ShtmlAsset {
    id: string;
    name: string;
    url?: string;
    mimeType?: string;
    content?: string;
}

const resolvedUrls = new Map<string, string>();

export const ShtmlAsset = {
    from(parent: Element, state: ShtmlDocumentState): ShtmlAsset[] {
        const elements = Array.from(parent.querySelectorAll(`:scope > ${NodeType.Asset}`));
        return elements.map(element => ShtmlAsset.parse(element, state));
    },
    parse(element: Element, state: ShtmlDocumentState): ShtmlAsset {
        const url = ShtmlDom.getAttribute(element, 'src');
        const asset: ShtmlAsset = {
            id: ShtmlDom.getAttribute(element, 'id') ?? $Id.guid(),
            name: ShtmlDom.getRequiredAttribute(element, 'name'),
            url,
            mimeType: ShtmlDom.getAttribute(element, 'type'),
            content: url ? undefined : element.innerHTML
        };
        state.assets[asset.id] = asset;
        return asset;
    },
    to(asset: ShtmlAsset): Element {
        const element = document.createElement(NodeType.Asset);
        element.setAttribute('id', asset.id);
        element.setAttribute('name', asset.name);
        if (asset.url) {
            element.setAttribute('src', asset.url);
        } else {
            if (asset.mimeType) element.setAttribute('type', asset.mimeType);
            if (asset.content) element.innerHTML = asset.content;
        }
        return element;
    },
    resolveUrl(asset: ShtmlAsset): string {
        if (asset.url) return asset.url;
        if (!resolvedUrls.has(asset.id)) {
            const url = URL.createObjectURL(new Blob([asset.content ?? ''], { type: asset.mimeType ?? 'application/octet-stream' }));
            resolvedUrls.set(asset.id, url);
        }
        return resolvedUrls.get(asset.id);
    },
    toLocal(assetIds: string[], state: ShtmlDocumentState): Record<string, string> {
        const assets = assetIds.map(id => state.assets[id]);
        return new Proxy({} as Record<string, string>, {
            get: (_, name) => {
                if (typeof name !== 'string') return undefined;
                const asset = assets.find(asset => asset.name === name);
                return asset ? ShtmlAsset.resolveUrl(asset) : undefined;
            }
        });
    }
};
