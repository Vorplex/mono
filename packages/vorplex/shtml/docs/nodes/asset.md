# `<x-asset>`

Declares a named asset — an image, icon, or other file-like resource.

## Syntax

```html
<x-asset name="logo" type="image/svg+xml">
    <svg>...</svg>
</x-asset>

<x-asset name="google" src="https://www.google.com/favicon.ico"></x-asset>
```

## Attributes

- `name` — the asset's identifier, resolved via the `asset.<name>` local available anywhere in a page or component's expressions.
- `src` (Optional) — an external URL. Omit it to declare the asset **inline** instead, using the node's own markup as the content.
- `type` (Optional if `src` is given) — the MIME type for an inline asset's content (e.g. `image/svg+xml`). Must be given when `src` is omitted — there's no reliable way to infer it from arbitrary markup, and guessing wrong means the browser silently fails to render it. Ignored when `src` is given.

## Behavior

Resolved once, at app startup, to a single URL: `src` is used as-is for external assets; inline assets are serialized and wrapped in an object URL. Either way, `asset.<name>` always returns a plain URL string — callers never need to know which kind it was declared as, or reason about the underlying object URL's lifetime.

`asset` is a reserved namespace, like [`<x-router>`](router.md)'s `router` or the [modal](../concepts/modals.md) `modal` local — never a bare name per asset, so an asset's name never competes with a variable/prop name. It's plain property access, not a function call: unlike [`<x-variable>`](variable.md) / [`<x-property>`](property.md), an asset's URL is static once resolved, so there's no read/write duality to express — no signal, nothing reactive, just a value.

Declared directly inside [`<x-app>`](app.md) or [`<x-component>`](component.md); like [`<x-type>`](type.md), it's structural — extracted once, not part of any page or component's live template. Scoping follows the same rule as everywhere else: an asset declared in `<x-app>` is available to any page, but a component only sees assets declared *inside itself* — it does not inherit the app's (see [Context & Isolation](../concepts/context-and-isolation.md)).
