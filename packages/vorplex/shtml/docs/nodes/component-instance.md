# `<x-component-instance>`

Renders an instance of a defined component.

## Syntax

```html
<x-component-instance component="badge"
                       text="Page not found"
                       status="error"
                       dismissed="onBadgeDismissed(event)"></x-component-instance>
```

## Attributes

- `component` (type: [expression](../concepts/expression.md)) — the `name` of the [`<x-component>`](component.md) to instantiate.
- Any other attribute matching a declared [`<x-event>`](event.md) name exactly (no prefix — an event named `dismissed` is listened to with a plain `dismissed="..."` attribute) is a one-shot event listener, evaluated the same way a native DOM event attribute is — see [Templating](../concepts/templating.md#event-handler-attributes).
- Every other attribute is passed through as the value of the matching [`<x-property>`](property.md) declared on that component.

Only `component` supports `{{expression}}` syntax on this structural node. Property attributes are literal values, and event attributes use the handler-call syntax described above.

## Behavior

`<x-component-instance>` is deliberately a generic node referencing a component by attribute, rather than a dedicated tag per component (e.g. a shorthand `<c-badge>`). Which component renders is then a matter of swapping the `component` attribute's value, not the tag name — simpler for the reactive system to retarget, and for future visual-designer tooling to manipulate. This mirrors [`<x-page-container>`](page-container.md), which references a page by attribute the same way.

Props passed here are the only way data crosses *into* a component; events are the only way data crosses back *out* — see [Context & Isolation](../concepts/context-and-isolation.md).
