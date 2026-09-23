# `union`

Any one of several definitions — parsing tries each in order and returns the first that matches with no errors.

```ts
interface TsonUnionDefinition {
    type: 'union';
    union: readonly TsonDefinition[];
    default?: { value: any };
}
```

| Field | Description |
| --- | --- |
| **union** | The candidate definitions, tried in order. Each is tried fail-fast, so a mismatch always reports one generic error, not which member(s) came closest. |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "union", "union": [{ "type": "string" }, { "type": "number" }] },
    "value": true
}
```
