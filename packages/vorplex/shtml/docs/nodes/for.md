# `<x-for>`

Iterates over an array or an object, rendering its children once per entry.

## Syntax

```html
<x-for each="{{['A', 'B', 'C']}}"
       as="item"
       index="itemIndex">
    <div>#{{itemIndex()}} {{item()}}</div>
</x-for>

<x-for each="{{items()}}"
       as="entry"
       track="id">
    <li>{{entry.label()}}</li>
</x-for>

<x-for each="{{settings()}}"
       as="value"
       key="property">
    <div>{{property()}}: {{value()}}</div>
</x-for>
```

## Attributes

- `each` (type: [expression](../concepts/expression.md)) — the array or object to iterate.
- `as` (Optional) — local variable name for the current entry. Defaults to `item`: `item()` reads the entry's whole current value, and — for object/array entries — `item.<property>()` reads just that property, e.g. `item.title()`. `as` renames the binding (e.g. `as="entry"` → `entry()` / `entry.<property>()` instead of `item()` / `item.<property>()`).
- `index` (Optional) — local variable name to expose the current iteration's numeric index under (e.g. `index="itemIndex"` → `itemIndex()`). No local is exposed if omitted.
- `key` (Optional) — local variable name to expose the entry's own inherent identity under: the array position for arrays, the property name for objects (e.g. `key="property"` on an object iteration → `property()` holds the current entry's key). Naming only — it doesn't affect reconciliation.
- `track` (Optional) — a property path resolved against the entry's *value*, used as its reconciliation identity across re-renders (the React/Solid "list key" concept), e.g. `track="id"` identifies each entry by its `id` property rather than by position. Omit it and entries are tracked by their inherent identity instead — the same thing `key` can expose as a local.

Only `each` is expression-enabled; `as`, `index`, `key`, and `track` are literal.

## Behavior

The list re-renders whenever a signal read inside `each` changes — see [Expression](../concepts/expression.md) for the reactivity rules that drive that. `track` (or, absent that, each entry's inherent identity) is what lets the runtime tell "this is the same entry, moved" apart from "this entry was removed and a new one added" across a re-render, instead of re-rendering the whole list. The conditional-rendering equivalent is [`<x-if>`](if.md).

Each entry is backed by a real [`State`](../concepts/reactivity.md) instance, not a bare signal — so `item.<property>()` only re-runs the bindings that read *that* property when the list recomputes, the same way any two `<x-variable>`s never re-run each other's bindings. Prefer `item.<property>()` over `item().property` wherever the property name is known ahead of time; fall back to calling `item()` for the whole value when you genuinely need it (e.g. passing an entire entry to a script method).

Don't wrap `<tr>` (or other restricted-content-model) elements directly in `<x-for>` — see [HTML Content Model Constraints](../concepts/html-content-model.md).
