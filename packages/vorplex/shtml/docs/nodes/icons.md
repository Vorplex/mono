# `<x-icons>`

Declares the icon sprite sheet [`<x-icon>`](icon.md) resolves names against.

## Syntax

```html
<x-icons src="https://cdn.jsdelivr.net/npm/lucide-static/sprite.svg"></x-icons>
```

## Attributes

- `src` (Optional) — the URL of an SVG sprite sheet (a `<svg>` document containing one `<symbol id="...">` per icon). Omit it entirely to use SHTML's built-in default — [Lucide](https://lucide.dev)'s own sprite — so [`<x-icon>`](icon.md) works with zero configuration. Swapping icon sets later is just changing this one URL; nothing at the call site (`<x-icon name="...">`) needs to change, as long as the new sheet uses the same names.

## Behavior

Declared directly inside [`<x-app>`](app.md), at most one per app; like [`<x-packages>`](packages.md), it's structural — extracted once, never part of any page or component's live template. Unlike [`<x-asset>`](asset.md)/[`<x-api>`](api.md)/[`<x-service>`](service.md), it isn't scoped/isolated — icons are a shared design-system resource, so the declared (or default) sheet is reachable from every page *and* every component in the app.

The sheet is fetched and parsed exactly once, into memory — never injected into the document as a shared `<symbol>` set. Every [`<x-icon>`](icon.md) instead clones its own matched icon's content directly into its own `<svg>` wherever it mounts. This is deliberate, not incidental: pages and components each render into their own shadow root, and SVG `<use>` can't resolve a `#name` fragment reference across a shadow root boundary — an open gap in the WebComponents spec, not a browser quirk to route around — so a single shared, referenced sprite would only work for icons rendered in whichever one tree it happened to be injected into. Cloning per instance sidesteps the boundary entirely and only costs what's actually used, rather than duplicating the whole sheet into every shadow root. An [`<x-icon>`](icon.md) mounted before the fetch finishes simply renders nothing until the sheet loads, then resolves automatically.
