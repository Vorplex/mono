# `<x-component>`

Defines a named, isolated, reusable component.

## Syntax

```html
<x-component name="badge">
    <x-import src="./script.ts"></x-import>
    <x-import src="./style.css"></x-import>
    <x-type name="badgeStatus">{ "type": "enum", "flags": ["success", "warning", "error"] }</x-type>
    <x-property name="text" type="string"></x-property>
    <x-property name="status" type="badgeStatus"></x-property>
    <x-event name="dismissed" type="string"></x-event>
    <span class.status="{{status()}}"
          style.font-size="{{text.length()}}">{{text()}}</span>
</x-component>
```

An inline component script is a typed module:

```html
<script type="application/typescript">
    export default Shtml.defineComponent(shtml => class {});
</script>
```

## Attributes

- `name` — the component's identifier, referenced by [`<x-component-instance>`](component-instance.md).

## Behavior

A component's contents are markup, plus whatever it imports: a `.ts` script with `export default Shtml.defineComponent(...)`, a `.css` stylesheet scoped to the component, local [`<x-type>`](type.md) definitions, [`<x-property>`](property.md) declarations for its props, [`<x-event>`](event.md) declarations for what it can emit, and — since a component can't reach the app's — its own local [`<x-variable>`](variable.md) state, [`<x-asset>`](asset.md) declarations, [`<x-api>`](api.md), [`<x-service>`](service.md), [`<x-packages>`](packages.md), and nested `<x-component>` definitions. Inline scripts require `type="application/typescript"`.

Components render into their own shadow DOM and are **fully isolated** from app/page context — see [Context & Isolation](../concepts/context-and-isolation.md).
