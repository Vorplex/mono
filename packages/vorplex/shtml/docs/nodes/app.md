# `<x-app>`

The root of an SHTML application. There is exactly one per app.

## Syntax

```html
<x-app>
    <x-import src="./pages/index.shtml"></x-import>
    <x-import src="./router.shtml"></x-import>
    <x-import src="./components/index.shtml"></x-import>
    <x-import src="./variables/index.shtml"></x-import>
    <x-import src="./script.ts"></x-import>
    <x-import src="./style.css"></x-import>
    <x-import src="./types/index.shtml"></x-import>
</x-app>
```

Inline scripts use the same module contract:

```html
<x-app>
    <script type="application/typescript">
        export default Shtml.defineApp(shtml => class {});
    </script>
</x-app>
```

## Attributes

None.

## Behavior

`<x-app>` itself defines no state or behavior directly — it's a composition root that [imports](../concepts/imports-and-composition.md) everything else in: the [router](router.md), [pages](page.md), [components](component.md), app-level [variables](variable.md) and [types](type.md), and the app's own script and stylesheet.

- The `.ts` file imported here is the **app script**, written as `export default Shtml.defineApp(shtml => class { ... })`. Inline equivalents require `<script type="application/typescript">`.
- The `.css` file imported here is the **app stylesheet**. For root declarations shared with shadow-DOM pages, target both `:root` and `:host` — see [Context & Isolation](../concepts/context-and-isolation.md).
- Variables imported (directly or transitively) become app-level state, reachable as `shtml.app.variables.<name>`.
- The [`<x-router>`](router.md) is optional. Without one, the app just renders its first declared [`<x-page>`](page.md) unconditionally — no route matching, no navigation.
