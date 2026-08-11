# HTML Content Model Constraints

SHTML source is parsed with the browser's own HTML parser (`DOMParser`, `text/html`), not a dedicated SHTML grammar — [imports](imports-and-composition.md) resolve by parsing each file this way and splicing the resulting DOM. That means every place the HTML5 parsing algorithm imposes a restricted content model, it applies to `<x-if>`, `<x-for>`, and `<x-import>` exactly as it would to any other unrecognized element.

## Known-broken: tables

`<table>`, `<thead>`, `<tbody>`, `<tfoot>`, and `<tr>` only accept a fixed set of direct children (`tr`, plus `thead`/`tbody`/`tfoot`/`caption`/`colgroup` at the table level). Any other element placed directly inside one of them — `<x-if>`, `<x-for>`, `<x-import>`, or a plain `<div>` — is **foster-parented**: the parser silently relocates it to just before the enclosing `<table>`, splitting it from the `<tr>`/`<td>` content it was meant to wrap:

```html
<!-- BROKEN: <x-for> gets foster-parented out of <tbody>, severing it from its own <tr> children -->
<table>
    <tbody>
        <x-for each="{{posts()}}" as="post" track="id">
            <tr><td>{{post.title()}}</td></tr>
        </x-for>
    </tbody>
</table>
```

The symptom isn't a parse error — it's a runtime `ReferenceError` for the loop's local (e.g. `post is not defined`), because by the time SHTML extracts the template, `<tr>`'s content is no longer inside `<x-for>`'s subtree at all.

## Workaround

Don't render literal `<table>`/`<tbody>`/`<tr>` structure through `<x-if>`/`<x-for>`. Build the same layout with `<div>` (or any element with no special content model) and CSS Grid instead — see `shtml/example/pages/posts/page.shtml`.

## Other likely-affected contexts (unverified)

The same class of bug is expected — but not yet confirmed against this runtime — anywhere else HTML5 defines a restricted content model or a dedicated insertion mode: `<select>`/`<optgroup>`/`<option>`, `<colgroup>`/`<col>`. Treat `<x-if>`/`<x-for>`/`<x-import>` inside any of these as unverified, and prefer the `<div>`-based workaround preemptively.

## Status

This is a known limitation of parsing SHTML source as HTML, not a design decision — no fix has landed yet.
