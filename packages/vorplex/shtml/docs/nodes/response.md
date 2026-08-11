# `<x-response>`

Declares the response shape of the enclosing [`<x-endpoint>`](endpoint.md).

## Syntax

```html
<x-response type="post"></x-response>
```

## Attributes

- `type` (Optional) — a TSON primitive type name (`any`, `string`, `number`, `boolean`, `object`, `array`, `enum`, `record`, `union`) or the `name` of an [`<x-type>`](type.md) declared in scope. Defaults to `any` when omitted.

## Behavior

Structural, declared inside [`<x-endpoint>`](endpoint.md) — never mounted directly. At most one per endpoint.
