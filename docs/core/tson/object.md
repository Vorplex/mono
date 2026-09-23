# `object`

```ts
interface TsonObjectDefinition {
    type: 'object';
    properties?: Record<string, TsonDefinition>;
    /** Applied via Object.setPrototypeOf to the parsed result -- an advanced, rarely-needed field. */
    prototype?: any;
    default?: { value: Record<string, any> };
}
```

| Field | Description |
| --- | --- |
| properties? | Named property definitions. Only these are copied onto the result — anything else on the input is dropped, and if any one property fails to validate the whole result collapses to `null`. Omitted (or `{}`), the object is unconstrained and passed through unchanged. |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": {
        "type": "object",
        "properties": {
            "name": { "type": "string" },
            "age": { "type": "number" }
        }
    },
    "value": { "name": "Alice", "age": 30, "extra": "dropped" }
}
```
