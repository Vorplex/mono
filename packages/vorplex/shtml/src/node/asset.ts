import { $Id } from '@vorplex/core';
import { ShtmlDocumentState } from '../shtml';
import { ShtmlDom } from '../shtml-dom';
import { NodeType } from './node-type';

export type ShtmlAssetSource =
    | { type: 'external'; url: string }
    | { type: 'internal'; content: string; mimeType?: string };

export interface ShtmlAsset {
    id: string;
    name: string;
    source: ShtmlAssetSource;
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
            source: url
                ? { type: 'external', url }
                : { type: 'internal', content: ShtmlDom.getContent(element), mimeType: ShtmlDom.getAttribute(element, 'type') }
        };
        state.assets[asset.id] = asset;
        return asset;
    },
    to(asset: ShtmlAsset): Element {
        const element = document.createElement(NodeType.Asset);
        element.setAttribute('id', asset.id);
        element.setAttribute('name', asset.name);
        if (asset.source.type === 'external') {
            element.setAttribute('src', asset.source.url);
        } else {
            if (asset.source.mimeType) element.setAttribute('type', asset.source.mimeType);
            if (asset.source.content) element.innerHTML = asset.source.content;
        }
        return element;
    },
    resolveUrl(asset: ShtmlAsset): string {
        if (asset.source.type === 'external') return asset.source.url;
        if (!resolvedUrls.has(asset.id)) {
            const url = URL.createObjectURL(new Blob([asset.source.content ?? ''], { type: asset.source.mimeType ?? 'application/octet-stream' }));
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
