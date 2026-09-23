# `array`

```ts
interface TsonArrayDefinition {
    type: 'array';
    itemDefinition?: TsonDefinition;
    min?: number;
    max?: number;
    default?: { value: any[] };
}
```

| Field | Description |
| --- | --- |
| itemDefinition? | Definition each item must satisfy. Every item is checked (not just until the first failure); if any one fails, the whole array collapses to `null`. Omitted, items pass through unvalidated. |
| min? | Minimum length |
| max? | Maximum length |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "array", "itemDefinition": { "type": "number" } },
    "value": [1, 2, "three"]
}
```
