# `<x-import>`

Splices another file's content into the current document, in place.

## Syntax

```html
<x-import src="./relative/path"></x-import>
<x-import src="./relative/path.ts"></x-import>
<x-import src="./relative/path.css"></x-import>
```

## Attributes

- `src` — path to the file to import, relative to the importing file. The `.shtml` extension may be omitted; `.ts` and `.css` must be given explicitly.

## Behavior

See [Imports & Composition](../concepts/imports-and-composition.md) for the full model. In short: `<x-import>` is a source-level text splice resolved before compilation, not a runtime module reference — the target file's content lands exactly where the `<x-import>` tag was.

Because resolution parses each file as HTML, an `<x-import>` placed directly inside a restricted-content-model parent (e.g. `<tbody>`) is subject to the same constraints as `<x-if>`/`<x-for>` — see [HTML Content Model Constraints](../concepts/html-content-model.md).
