# Reactivity

Every [`<x-variable>`](../nodes/variable.md) and [`<x-property>`](../nodes/property.md) is exposed as a Vorplex **signal**:

- Call it with **no arguments** to read: `count()`, `app.name()`.
- Call it with **one argument** to write a new value: `count(count() + 1)`.

## Path subscriptions

Object and array paths are signals. Prefer the narrowest known path:

```html
{{data.cases()}}       <!-- subscribes to cases -->
{{data.user.name()}}   <!-- subscribes to user.name -->
{{data()}}             <!-- subscribes to the whole value -->
```

Path traversal is internally null-safe, like optional chaining: `data.user.name()` returns `undefined` if an intermediate value is nullish. Calling the whole signal first, such as `data().user.name`, works but creates a broader subscription and re-runs when unrelated parts of `data` change.

A path signal follows the same call convention as its root: `data.user.name("New name")` writes that path.

The same rule applies to loop entries: prefer `item.title()` over `item().title`. Call the whole signal only when the consumer genuinely needs the entire value.

## In templates

- Interpolation reads a signal reactively — see [Templating](templating.md).
- Event handler attributes call signals (or script methods) to write.
- [`<x-if>`](../nodes/if.md) and [`<x-for>`](../nodes/for.md) re-evaluate whenever a signal they read changes.
- A page template gets framework locals for routing and modals: `router.route()`/`router.params.<name>()`, plus `modal.data`/`modal.close(result)`. In scripts, route and parameters are plain reads (`shtml.router.route`/`shtml.router.params`), while navigation is `shtml.router.navigate(route)`. Open a modal with `shtml.pages.<name>.showModal({ data })`; see [Modals](modals.md). These locals do not reach component templates.
- [`<x-asset>`](../nodes/asset.md)'s `asset.<name>` is the same kind of reserved namespace as `router`/`modal` (never a bare name per asset), but unlike them it *is* available in component templates too — an asset is declared data, not a page-rendering concern, so it isn't subject to the same isolation rule (though a component still only sees its own declared assets, never the app's).

## In scripts

Scripts never receive bare context-injected identifiers — that shorthand is template/event-handler-only. Scripts default-export `Shtml.defineApp(...)`, `Shtml.definePage(...)`, `Shtml.defineComponent(...)`, or `Shtml.defineService(...)`; state access goes through the definition's `shtml` parameter:

- `shtml.app.variables.<name>` / `shtml.page.variables.<name>` / `shtml.component.variables.<name>` — a variable's full signal surface (see [`<x-variable>`](../nodes/variable.md)): `get()`, `set(value)`, `reset()`, `validate()`.
- `shtml.component.props.<name>()` — a component's own prop, get-only (the caller's own binding already owns writes — see [`<x-property>`](../nodes/property.md)).

## Foundation

Signals, and the state they back, come from Vorplex — see [Foundation](../readme.md#foundation). SHTML doesn't add a competing reactivity model on top; it's the templating and node layer over Vorplex's.
