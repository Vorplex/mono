# `<x-property>`

Declares a typed prop on a component.

## Syntax

```html
<x-property name="text" type="string"></x-property>
<x-property name="status" type="badgeStatus"></x-property>
```

## Attributes

- `name` — the prop's identifier. Exposed inside the component as a callable signal of the same name.
- `type` (Optional) — a TSON primitive type name (`any`, `string`, `number`, `boolean`, `object`, `array`, `enum`, `record`, `union`) or the `name` of an [`<x-type>`](type.md) declared in scope. Defaults to `any` when omitted.

## Behavior

A property is the only way data enters an [`<x-component>`](component.md) from the outside — set at the call site via a matching attribute on [`<x-component-instance>`](component-instance.md). Inside the component it behaves like any other signal — see [Reactivity](../concepts/reactivity.md). It's the component-scoped equivalent of [`<x-variable>`](variable.md).

Object and array properties support the same null-safe path subscriptions as variables; prefer `profile.name()` to `profile().name` when the whole object is not needed.
