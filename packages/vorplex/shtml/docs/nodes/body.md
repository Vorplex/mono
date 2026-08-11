# `<x-body>`

Declares the request body shape of the enclosing [`<x-endpoint>`](endpoint.md).

## Syntax

```html
<x-body type="post"></x-body>
```

## Attributes

- `type` (Optional) — a TSON primitive type name (`any`, `string`, `number`, `boolean`, `object`, `array`, `enum`, `record`, `union`) or the `name` of an [`<x-type>`](type.md) declared in scope. Defaults to `any` when omitted.

## Behavior

Structural, declared inside [`<x-endpoint>`](endpoint.md) — never mounted directly. At most one per endpoint. The counterpart to [`<x-response>`](response.md): `<x-body>` describes what the endpoint sends, `<x-response>` describes what it sends back. [`<x-parameter>`](parameter.md) stays for discrete values that shape the request itself (path/query parameters) — `<x-body>` is for the payload as a whole, so the two commonly appear together on the same endpoint (e.g. an `id` path parameter alongside a typed update body).
