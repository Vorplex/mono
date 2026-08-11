# Imports & Composition

[`<x-import src="...">`](../nodes/import.md) is SHTML's source-level composition primitive. Imports are resolved before compilation and placed where the `<x-import>` appears.

That has a few direct consequences:

- Imports must be resolved before the rest of the document is compiled — an `<x-import>` isn't a runtime module reference, it's a source-level substitution that has to happen first.
- Where you put the `<x-import>` tag is where the imported content ends up. Order matters the same way it would if you'd pasted the file in by hand.
- The same tag imports SHTML markup, TypeScript modules, and CSS; the file extension determines how the content is materialized.

## Supported file types

| Extension | What gets spliced in |
|---|---|
| `.shtml` | Markup spliced into the importing document |
| `.ts` | A `<script type="application/typescript">` node |
| `.css` | A `<style>` node |

The `.shtml` extension may be omitted (`<x-import src="./header/page">` is equivalent to `<x-import src="./header/page.shtml">`); `.ts` and `.css` are always given explicitly.

## TypeScript module contract

An imported `.ts` file must default-export exactly one definition appropriate to its enclosing node:

```ts
export default Shtml.definePage(shtml => class {
    onMount() {}
});
```

Do not put a `<script>` tag in the `.ts` file. For inline TypeScript in `.shtml`, use the equivalent typed script node:

```html
<script type="application/typescript">
    export default Shtml.definePage(shtml => class {});
</script>
```

## Structure is a convention, not a rule

Because `<x-import>` can pull a node in from any file, SHTML doesn't require any particular folder layout — an entire app could be written in one `.shtml` file. The layout used in `shtml/example/` (one folder per page/component, each with its own `page.shtml`/`component.shtml`, `script.ts`, and `style.css`, wired together with `<x-import>`) is a project-organization convention on top of the language, not something SHTML enforces or needs to know about.
