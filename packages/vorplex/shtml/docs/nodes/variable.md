# `<x-variable>`

Declares a piece of reactive state.

## Syntax

```html
<x-variable name="app" type="app">
    { "name": "My App" }
</x-variable>

<x-variable name="count"></x-variable>
```

## Attributes

- `name` — the variable's identifier.
- `type` (Optional) — a TSON primitive type name (`any`, `string`, `number`, `boolean`, `object`, `array`, `enum`, `record`, `union`) or the `name` of an [`<x-type>`](type.md) declared in scope. Defaults to `any` when omitted — `count` above is untyped for exactly that reason.

## Body

An optional default value, written in [TSON](../readme.md#foundation) — the same typed data-literal format used in `<x-type>` schemas.

## Behavior

Like [`<x-type>`](type.md), `<x-variable>` is structural: every variable declared directly inside an [`<x-app>`](app.md), [`<x-page>`](page.md), or [`<x-component>`](component.md) is extracted and initialized once, upfront — not in document order like ordinary template content, so where the tag sits among a page's or component's other markup doesn't matter.

Where it's declared determines its scope:

- Inside `<x-app>` → an **app variable**, reachable from any page as `shtml.app.variables.<name>`, with the full signal surface: `get()`, `set(value)`, `reset()`, `validate()`.
- Inside an `<x-page>` → **page-local state** — the call-to-read/call-to-write shorthand in that page's own template, and `shtml.page.variables.<name>` (same full signal surface as an app variable) in that page's own script — see [Reactivity](../concepts/reactivity.md).
- Inside an `<x-component>` → **component-local state**, exposed the same way (template shorthand + `shtml.component.variables.<name>` in script), isolated the same way `<x-property>`/`<x-asset>` already are (see [Context & Isolation](../concepts/context-and-isolation.md)) — never reachable from outside the component, and doesn't inherit the app's variables.

It's the page/app/component-scoped equivalent of [`<x-property>`](property.md).

Object and array variables expose null-safe path signals. In templates, prefer `data.cases()` or `data.user.name()` to `data().cases` or `data().user.name` so only the used path is subscribed — see [Reactivity](../concepts/reactivity.md#path-subscriptions).
