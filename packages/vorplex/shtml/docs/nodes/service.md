# `<x-service>`

Declares a named, reusable service — a plain TypeScript class with no template, for behavior that doesn't belong to any one page or component.

## Syntax

```html
<x-service name="logger">
    <x-import src="./script.ts"></x-import>
</x-service>
```

`script.ts` contains:

```ts
export default Shtml.defineService(shtml => class {});
```

For an inline service script, wrap the same default export in `<script type="application/typescript">`.

## Attributes

- `name` — the service's identifier.

## Behavior

Declared directly inside [`<x-app>`](app.md) or [`<x-component>`](component.md); structural, like [`<x-api>`](api.md). Its TypeScript module must `export default Shtml.defineService(shtml => class { ... })`. Declared inside a component, a service is local to that component, like its variables, assets, and APIs.

Declaring a service only defines it — nothing here instantiates or calls it. Execution (reaching a service from a script, e.g. `shtml.services.<name>...`) isn't implemented yet; for now this is the declaration only.
