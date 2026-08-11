# `<x-api>`

Declares a named, app-wide API — its base URL plus the operations available on it.

## Syntax

```html
<x-api name="jsonPlaceholder" url="https://jsonplaceholder.typicode.com">
    <x-endpoint path="/posts" method="GET">
        <x-response type="array"></x-response>
    </x-endpoint>
</x-api>
```

## Attributes

- `name` — the API's identifier.
- `url` — the base URL every [`<x-endpoint>`](endpoint.md)'s `path` is resolved against.

## Behavior

Declared directly inside [`<x-app>`](app.md) or [`<x-component>`](component.md); structural, like [`<x-asset>`](asset.md) — extracted once, not part of any page or component's live template. Holds one or more [`<x-endpoint>`](endpoint.md) declarations. Declared inside a component, an API is local to that component, the same as its [`<x-variable>`](variable.md), [`<x-asset>`](asset.md), and nested `<x-component>` declarations.

Declaring an API only describes it — nothing here performs a request on its own. Execution (calling an endpoint from a script, e.g. `shtml.api.<name>...`) isn't implemented yet; for now this is the declaration only.
