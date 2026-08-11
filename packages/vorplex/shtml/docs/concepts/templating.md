# Templating

SHTML templates are plain markup with expressions and event handler attributes layered on top.

## Interpolation

Use `{{expression}}` in text, any HTML or SVG element attribute, and any [`<x-icon>`](../nodes/icon.md) attribute:

```html
<h1 title="Case {{caseId()}}">{{caseId()}}</h1>
<svg aria-label="{{label()}}"></svg>
<x-icon name="{{expanded() ? 'chevron-up' : 'chevron-down'}}"></x-icon>
```

Structural SHTML nodes do not support expressions on every attribute. The supported attributes are:

- [`<x-for each="{{items()}}">`](../nodes/for.md)
- [`<x-if condition="{{visible()}}">`](../nodes/if.md)
- [`<x-page-container page="{{selectedPage()}}">`](../nodes/page-container.md)
- [`<x-component-instance component="{{selectedComponent()}}">`](../nodes/component-instance.md)

When a signal read by a supported attribute expression changes, SHTML updates that attribute and the owning element or node responds to its new value.

## Dynamic attribute binding

On HTML/SVG elements and `<x-icon>`, the specialized form `prefix.key="{{expression}}"` binds `key` under `prefix`:

- `class.<name>` toggles the `<name>` class on/off based on whether the expression is truthy.
- `style.<property>` sets a single inline style property.

## Event handler attributes

A standard-looking DOM event attribute (`onclick`, etc.) takes a plain call — **not** an [expression](expression.md) — that invokes a method or signal in scope. It resolves against the enclosing page/component's script class, or a signal, per the rules in [Reactivity](reactivity.md), and runs once per event rather than being reactively tracked.
