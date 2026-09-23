import { Signal, SignalProxy } from '@vorplex/core';
import { DrxDocumentState } from './drx';
import { DrxAsset } from './node/asset';
import type { DrxTemplateItem } from './node/template-item';

export interface PreviewContext {
    root: Signal<DrxDocumentState>;
    componentId?: string;
    resolveAsset?: (asset: DrxAsset) => string;
    styleSheets: CSSStyleSheet[];
    render?: (item: DrxTemplateItem, state: SignalProxy<DrxDocumentState>) => ChildNode | null | undefined;
}
