import { Signal } from '@vorplex/core';
import { DrxAsset } from './node/asset';
import { DrxDocumentState } from './drx';

export interface PreviewContext {
    root: Signal<DrxDocumentState>;
    componentId?: string;
    resolveAsset?: (asset: DrxAsset) => string;
    styleSheets: CSSStyleSheet[];
}
