# `record`

An object with dynamic keys — every property shares one value type, unlike [`object`](object.md)'s fixed, named properties.

```ts
interface TsonRecordDefinition {
    type: 'record';
    property?: TsonDefinition;
    default?: { value: Record<string, any> };
}
```

| Field | Description |
| --- | --- |
| property? | Definition every value in the record must satisfy. Every entry is checked; if any one fails, the whole record collapses to `null`. Omitted, values pass through unvalidated. |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "record", "property": { "type": "number" } },
    "value": { "a": 1, "b": "two" }
}
```
