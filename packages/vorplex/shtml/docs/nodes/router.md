# `<x-router>`

Container for an app's route table.

## Syntax

```html
<x-router>
    <x-route route="/" page="shell"></x-route>
    <x-route route="/404" />
</x-router>
```

## Attributes

None.

## Behavior

Holds one or more [`<x-route>`](route.md) definitions. Imported once into [`<x-app>`](app.md), typically from its own `router.shtml`.

## Reading the current route

Once a `<x-router>` is mounted, `router` is available as a local in every page's template (and in any page it embeds via [`<x-page-container>`](page-container.md), including ones outside the router itself) — the same callable-signal convention as everything else in [Reactivity](../concepts/reactivity.md):

- `router.route()` — the currently matched [`<x-route>`](route.md)'s own `route` pattern (e.g. `/posts`, or `/posts/{id}` — the pattern itself, not the resolved path), reactive.
- `router.params()` — the current route's captured path parameters, reactive.
- `router.params.<name>()` — a single captured parameter, e.g. `router.params.id()` for a route pattern containing `{id}`.

This is what lets a nav link highlight itself as active:

```html
<a href="#/posts" class.active="{{router.route() === '/posts'}}">Posts</a>
```

Scripts reach the same state via `shtml.router.route`/`shtml.router.params` (plain, non-reactive reads — see [Reactivity](../concepts/reactivity.md#in-scripts)) and navigate imperatively with `shtml.router.navigate(route)`.
