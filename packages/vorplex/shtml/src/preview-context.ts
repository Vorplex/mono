import { Signal } from '@vorplex/core';
import { ShtmlAsset } from './node/asset';
import { ShtmlDocumentState } from './shtml';

export interface PreviewContext {
    root: Signal<ShtmlDocumentState>;
    componentId?: string;
    resolveAsset?: (asset: ShtmlAsset) => string;
    styleSheets: CSSStyleSheet[];
}
