# \<x-type>

Declares a named, reusable [TSON](../core/tson/index.html) schema referenced by name from any `type` attribute, or by `{ "type": "ref", "id": "<name-of-type>" }` from within another inline TSON definition (such as an `<x-body>`/`<x-response>`). Use it to validate `<x-variable>`, `<x-property>`/`<x-event>`, and to avoid repeating the same schema inline in multiple places.

```html
<x-type></x-type>
```

| Attribute | Description      |
| --------- | ---------------- |
| **name**  | Name of the type |

## Resolution

A type name resolves against the types declared on the owner it's used in: the app for the app and its pages, or the component and every component enclosing it. A namespaced name such as `ui.priority` takes the top-level `priority` type of the [`ui` library](x-libraries.md).

## Example
```html drx
<x-app>
    <x-type name="priority">{ "type": "enum", "flags": ["low", "medium", "high"] }</x-type>

    <x-variable name="taskPriority" type="priority">"medium"</x-variable>
    <p>{{taskPriority()}}</p>
</x-app>
```
