# `<x-header>`

Declares one HTTP header of the enclosing [`<x-endpoint>`](endpoint.md).

## Syntax

```html
<x-header name="authorization" required></x-header>
```

## Attributes

- `name` — the header's name.
- `required` (Optional) — a boolean attribute, same presence-only convention as [`<x-parameter>`](parameter.md)'s.

## Behavior

Structural, declared inside [`<x-endpoint>`](endpoint.md) — never mounted directly.
