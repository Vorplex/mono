# `<x-if>`

Conditionally renders its children.

## Syntax

```html
<x-if condition="{{count() >= 10}}">
    <span>Larger than 10!</span>
</x-if>
```

## Attributes

- `condition` (type: [expression](../concepts/expression.md)) — children render only while this evaluates truthy.

## Behavior

The block re-renders whenever a signal read inside `condition` changes — see [Expression](../concepts/expression.md) for the reactivity rules that drive that. The list-rendering equivalent is [`<x-for>`](for.md).

Don't wrap `<tr>` (or other restricted-content-model) elements directly in `<x-if>` — see [HTML Content Model Constraints](../concepts/html-content-model.md).
