# `<x-endpoint>`

Declares one operation of the enclosing [`<x-api>`](api.md).

## Syntax

```html
<x-endpoint path="/posts/{id}" method="PUT">
    <x-parameter name="id" required></x-parameter>
    <x-body type="post"></x-body>
    <x-response type="post"></x-response>
</x-endpoint>
```

## Attributes

- `path` — the request path, appended to the enclosing `<x-api>`'s `url`.
- `method` (Optional) — the HTTP method. Defaults to `GET`.

## Behavior

Structural, declared inside [`<x-api>`](api.md) — never mounted directly. Holds the operation's [`<x-parameter>`](parameter.md) and [`<x-header>`](header.md) declarations, at most one [`<x-body>`](body.md), and at most one [`<x-response>`](response.md).
