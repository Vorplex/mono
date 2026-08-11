# `<x-parameter>`

Declares one parameter of the enclosing [`<x-endpoint>`](endpoint.md).

## Syntax

```html
<x-parameter name="id" required></x-parameter>
<x-parameter name="skip"></x-parameter>
```

## Attributes

- `name` — the parameter's identifier.
- `required` (Optional) — a boolean attribute, presence-only (e.g. `<x-parameter name="id" required>`), the same convention as `disabled`/`hidden` on plain HTML elements. Absent means optional.

## Behavior

Structural, declared inside [`<x-endpoint>`](endpoint.md) — never mounted directly.
