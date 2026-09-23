# `enum`

One of a fixed set of literal string or number values.

```ts
interface TsonEnumDefinition<T extends string | number = any> {
    type: 'enum';
    flags: T[];
    default?: { value: T };
}
```

| Field | Description |
| --- | --- |
| **flags** | The allowed literal values — all strings or all numbers |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "enum", "flags": ["low", "medium", "high"] },
    "value": "urgent"
}
```
