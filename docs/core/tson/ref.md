# `ref`

A placeholder that points at another named type by id — not something you parse directly. It exists so a definition can reference a type before that type is known/resolved; a consumer resolves every `ref` to its real definition before parsing ever sees it.

```ts
interface TsonRefDefinition {
    type: 'ref';
    id: string;
}
```

| Field | Description |
| --- | --- |
| **id** | The id of the type this reference points at |

```json tson
{
    "definition": { "type": "ref", "id": "priority" },
    "value": "medium"
}
```
