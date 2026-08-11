# Context & Isolation

[Pages](../nodes/page.md) and [components](../nodes/component.md) both render into their own shadow DOM, but they sit on opposite sides of a strict context boundary.

## Pages inherit app context

- **Style**: the app stylesheet is inherited by pages, so a page doesn't re-import it. Pages render in shadow DOM, however, so document-root and shadow-host selectors are different.
- **Behavior**: a page's script can call public members of the app instance (`shtml.app.instance.<method>(...)`) and read/write app-level variables (`shtml.app.variables.<name>`).

Pages are, in effect, an extension of the app — the shadow boundary isolates rendering, not context.

### Root styles across pages

Use both `:root` and `:host` for declarations that must initialize at the app root and each page host:

```css
:root,
:host {
    --accent: #d32f2f;
    color: var(--text);
    background: var(--background);
}
```

`:root` matches the document root; `:host` matches the host of a page's shadow root. Inherited properties and custom properties flow into the page, but ordinary selectors do not pierce a shadow boundary. Page-local styles may use `:host` alone. Components remain isolated and only receive styles declared in their own component scope.

## Components are sandboxed

A component has **no access** to anything outside itself: not the app instance, not app variables, not the page it's rendered in, not even the app's [`<x-asset>`](../nodes/asset.md) or nested [`<x-component>`](../nodes/component.md) declarations — those must be declared again, locally, inside the component that uses them, the same way [`<x-type>`](../nodes/type.md) and [`<x-property>`](../nodes/property.md) already work. This holds no matter how deeply a component is nested. The only way data or behavior crosses a component's boundary is:

- **In**, via declared [`<x-property>`](../nodes/property.md) values passed at the `<x-component-instance>` call site.
- **Out**, via events (the component emits, the consumer listens).

This is a deliberate design constraint, not an incidental limitation: a component that could reach into ambient app/page context would stop being independently reusable or reasoning-about-able in isolation.

## Why this matters for authoring

When you're inside an `<x-component>` script or template, assume the outside world doesn't exist — everything you need must already have arrived as a prop. When you're inside an `<x-page>`, the app is available to you, so there's no need to re-thread app state through props the way you would for a component.
