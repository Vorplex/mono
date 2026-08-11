# `<x-route>`

Maps a URL path to a page.

## Syntax

```html
<x-route route="/" page="shell"></x-route>
<x-route route="/404" />
```

## Attributes

- `route` — the URL path to match.
- `page` (Optional) — the [page](page.md) `name` to render for this route. Pages are referenced by their declared name, not by file path. Falls back to `route`'s own path segment when omitted (e.g. `route="/404"` → page `404`).

## Behavior

Declared inside [`<x-router>`](router.md). When the router matches `route`, it renders the [`<x-page>`](page.md) whose `name` equals `page`.
