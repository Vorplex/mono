# SHTML

SHTML (Structured HTML) is a declarative markup language for building reactive web apps out of composable **nodes**: apps, pages, components, variables, and types. Markup, styles, and behavior are colocated and pulled together via explicit imports, compiling down to a runtime powered by [Vorplex](#foundation).

This documentation describes SHTML's concepts and user-facing API. It does not describe the implementation (compiler, bundler, runtime internals) that lives in `shtml/src`.

## Design principles

- **Explicit composition.** Nothing is implicitly in scope. Every dependency — a script, a stylesheet, a page, a component, a variable, a type — must be pulled in with [`<x-import>`](nodes/import.md) at the point that needs it.
- **Structure is a convention, not a requirement.** SHTML doesn't mandate a file layout. A whole app can be authored in a single `.shtml` file; splitting it into one-folder-per-concept (as in `shtml/example/`) is a project-organization choice, made possible because `<x-import>` can pull any node in from anywhere. See [Imports & Composition](concepts/imports-and-composition.md).
- **State is signals, everywhere.** Anything declared with [`<x-variable>`](nodes/variable.md) or [`<x-property>`](nodes/property.md) is a callable signal. Object paths are signals too: prefer `data.cases()` or `data.user.name()` over the broader `data().cases` or `data().user.name`. See [Reactivity](concepts/reactivity.md).
- **Pages share context; components don't.** Pages inherit the app's style cascade and can reach into the app instance and app variables. Components are fully isolated and communicate only through declared props and events. This boundary is load-bearing, not incidental — see [Context & Isolation](concepts/context-and-isolation.md).
- **Expression support is explicit.** Text, every HTML/SVG element attribute, and every `<x-icon>` attribute support expressions. For structural SHTML nodes, the expression-enabled attributes are `x-for.each`, `x-if.condition`, `x-page-container.page`, and `x-component-instance.component`.
- **Scripts are TypeScript modules.** Inline scripts use `type="application/typescript"`; inline and imported scripts must `export default Shtml.define…`. Anything importable in TypeScript is available to the bundler.

## Executable scripts

Every app, page, component, or service script is a TypeScript module with one default SHTML definition:

```html
<script type="application/typescript">
    export default Shtml.definePage(shtml => class {
        onMount() {
            // Page lifecycle and behavior.
        }
    });
</script>
```

An imported `.ts` file contains the same `export default Shtml.define…` statement without a surrounding `<script>` tag; [`<x-import>`](nodes/import.md) creates the typed script node. Use `defineApp`, `definePage`, `defineComponent`, or `defineService` for the enclosing node.

## Foundation

SHTML's runtime behavior is built on top of Vorplex primitives: **Signal**, **State**, and **Utils** for reactivity, **TSON** as the typed data-literal format used inside [`<x-variable>`](nodes/variable.md) and [`<x-type>`](nodes/type.md) bodies, and a dedicated **compiler**, **bundler**, and **module loader** that turn a tree of `.shtml`/`.ts`/`.css` files into an app. These are foundation pieces, not user-facing API surface, and aren't documented further here.

## Node reference

| Node | Purpose |
|---|---|
| [`<x-app>`](nodes/app.md) | Root of an SHTML application |
| [`<x-import>`](nodes/import.md) | Splices another file's content into the current one |
| [`<x-router>`](nodes/router.md) | Container for route definitions |
| [`<x-route>`](nodes/route.md) | Maps a URL path to a page |
| [`<x-page>`](nodes/page.md) | Defines a named page |
| [`<x-page-container>`](nodes/page-container.md) | Renders a page inline as a layout slot |
| [`<x-component>`](nodes/component.md) | Defines a named, isolated component |
| [`<x-component-instance>`](nodes/component-instance.md) | Renders a component instance |
| [`<x-property>`](nodes/property.md) | Declares a typed prop on a component |
| [`<x-event>`](nodes/event.md) | Declares an emittable event on a component |
| [`<x-variable>`](nodes/variable.md) | Declares a piece of reactive state |
| [`<x-type>`](nodes/type.md) | Declares a named, reusable type/schema |
| [`<x-asset>`](nodes/asset.md) | Declares a named asset URL |
| [`<x-api>`](nodes/api.md) | Declares a named, app-wide API |
| [`<x-endpoint>`](nodes/endpoint.md) | Declares one operation of an API |
| [`<x-parameter>`](nodes/parameter.md) | Declares one parameter of an endpoint |
| [`<x-header>`](nodes/header.md) | Declares one HTTP header of an endpoint |
| [`<x-body>`](nodes/body.md) | Declares the request body shape of an endpoint |
| [`<x-response>`](nodes/response.md) | Declares the response shape of an endpoint |
| [`<x-service>`](nodes/service.md) | Declares a named, reusable service |
| [`<x-packages>`](nodes/packages.md) | Declares npm package versions available to scripts |
| [`<x-if>`](nodes/if.md) | Conditionally renders its children |
| [`<x-for>`](nodes/for.md) | Renders its children once per entry of an array or object |

## Concepts

- [Imports & Composition](concepts/imports-and-composition.md)
- [Reactivity](concepts/reactivity.md)
- [Context & Isolation](concepts/context-and-isolation.md)
- [Modals](concepts/modals.md)
- [Templating](concepts/templating.md)
- [Expression](concepts/expression.md)
- [HTML Content Model Constraints](concepts/html-content-model.md)

## Reference example

`shtml/example/` is the canonical, working example this documentation is fact-checked against. If a doc page and the example ever disagree, that's a bug in one of them — file it before trusting either.
