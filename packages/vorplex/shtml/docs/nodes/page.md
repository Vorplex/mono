# `<x-page>`

Defines a named page.

## Syntax

```html
<x-page name="shell">
    <x-import src="./script.ts"></x-import>
    <x-import src="./style.css"></x-import>
    <x-variable name="count"></x-variable>
    <x-page-container page="header"></x-page-container>
    <button onclick="count(count() + 1)">{{count()}}</button>
    <x-if condition="{{count() >= 10}}">
        <span>Larger than 10!</span>
    </x-if>
</x-page>
```

An inline page script is a typed module:

```html
<script type="application/typescript">
    export default Shtml.definePage(shtml => class {
        onMount() {}
    });
</script>
```

## Attributes

- `name` — the page's identifier, referenced by [`<x-route>`](route.md) and [`<x-page-container>`](page-container.md).

## Behavior

A page's contents are markup, plus whatever it imports:

- A `.ts` script, written as `export default Shtml.definePage(shtml => class { ... })`, defining the page's methods and lifecycle. Inline scripts require `type="application/typescript"`.
- A `.css` stylesheet, scoped to the page.
- [`<x-variable>`](variable.md) declarations for page-local state — structural, so they don't need to appear before whatever uses them.
- [`<x-page-container>`](page-container.md) to nest another page inline (e.g. a shared header/shell layout).

Pages render into shadow DOM but inherit the app's context, unlike [`<x-component>`](component.md). Use `:host` for a page's shadow-root host; shared app-root rules should use `:root, :host` — see [Context & Isolation](../concepts/context-and-isolation.md).

## Page API

Page scripts can address every declared page through `shtml.pages.<name>` (or bracket notation for names containing hyphens):

- `shtml.pages.<name>.show()` selects that page only when the app has no router. It throws when a router owns page selection.
- `shtml.pages.<name>.showModal(options?)` mounts the page in a modal. It accepts `{ data?: any }` and returns a promise resolved by `modal.close(result)` in the mounted page.

The framework supplies only a fixed full-screen host; the modal page owns its backdrop, centering, sizing, and other presentation. See [Modals](../concepts/modals.md).
