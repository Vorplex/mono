# \<x-dependency-tree>

Caches the resolved dependency graph for the app or component's `<x-packages>` declarations. It's written by tooling during compilation, not hand-authored — treat its content as opaque generated output rather than something to edit directly.

```html
<x-dependency-tree></x-dependency-tree>
```

No attributes, content is a compiler-generated JSON object.

## Example
```html drx
<x-app>
    <x-packages>{ "lodash": "^4.17.21" }</x-packages>
    <x-dependency-tree>{ }</x-dependency-tree>

    <h1>Home</h1>
</x-app>
```
