import { Signal } from '@vorplex/core';
import { ShtmlApp } from './node/app';
import { ShtmlAsset } from './node/asset';
import { ShtmlComponent } from './node/component/component';
import { ShtmlDocumentState } from './shtml';

// Deliberately lighter than RenderContext -- preview never evaluates a script or expression, so it has no
// `compiled`, no `locals`, no `nearest.page` (pages aren't an isolation boundary, only components are), and
// no per-mount variable/prop state. `root` is the live document signal itself (not a state snapshot) so every
// preview mount function can read through `root.proxy...` inside its own Signal.effect and stay in sync with
// state edits -- see shtml/src/expression-display.ts and the *.preview() methods for how it's used.
export interface PreviewContext {
    root: Signal<ShtmlDocumentState>;
    app: ShtmlApp;
    component?: ShtmlComponent;
    resolveAsset?: (asset: ShtmlAsset) => string;
    styleSheets: CSSStyleSheet[];
}

export const PreviewContext = {
    // Component instances are the only isolation boundary preview needs to track -- pages inherit whatever
    // scope they were reached from, matching RenderContext's own isolation model.
    withComponent(context: PreviewContext, component: ShtmlComponent): PreviewContext {
        return { ...context, component };
    }
};
