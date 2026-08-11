# `<x-event>`

Declares an emittable event on a component.

## Syntax

```html
<x-event name="dismissed" type="string"></x-event>
```

## Attributes

- `name` — the event's identifier. Reachable from the component's own script as `shtml.component.events.<name>.emit(payload)`.
- `type` (Optional) — a TSON primitive type name (`any`, `string`, `number`, `boolean`, `object`, `array`, `enum`, `record`, `union`) or the `name` of an [`<x-type>`](type.md) declared in scope, describing the emitted payload. Defaults to `any` when omitted.

## Behavior

An event is the only way data leaves an [`<x-component>`](component.md) — the reverse of [`<x-property>`](property.md), which is the only way data enters. A consumer listens by declaring an attribute matching the event's `name` exactly (no prefix) at the [`<x-component-instance>`](component-instance.md) call site (e.g. `dismissed="handler(event)"`), evaluated the same way a native DOM event attribute is: a one-shot call, not a continuous binding, with `event` bound to whatever payload was passed to `.emit(...)`.
