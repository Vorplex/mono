# `<x-type>`

Declares a named, reusable type/schema for use by [`<x-variable>`](variable.md) and [`<x-property>`](property.md).

## Syntax

```html
<x-type name="app">{ "type": "object", "properties": { "name": { "type": "string" } } }</x-type>

<x-type name="badgeStatus">{ "type": "enum", "flags": ["success", "warning", "error"] }</x-type>
```

## Attributes

- `name` — the type's identifier, referenced by the `type` attribute on `<x-variable>` / `<x-property>`.

## Body

A schema written in [TSON](../readme.md#foundation):

- `{ "type": "object", "properties": { ... } }` — an object shape, each property itself a nested type.
- `{ "type": "enum", "flags": [...] }` — a closed set of string values.

## Behavior

A type declared inside an [`<x-component>`](component.md) is local to that component; one imported into [`<x-app>`](app.md) is available app-wide, wherever a `type` attribute names it.
