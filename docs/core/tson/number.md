# `number`

```ts
interface TsonNumberDefinition {
    type: 'number';
    min?: number;
    max?: number;
    integer?: boolean;
    default?: { value: number };
}
```

| Field | Description |
| --- | --- |
| min? | Minimum value |
| max? | Maximum value |
| integer? | Declares the value as integer-only for `accepts()` compatibility checks — not currently enforced by `.parse()` itself; a non-integer value still passes parsing even with `integer: true` set |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "number", "min": 0, "max": 10 },
    "value": 15
}
```
