# `boolean`

```ts
interface TsonBooleanDefinition {
    type: 'boolean';
    default?: { value: boolean };
}
```

| Field | Description |
| --- | --- |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "boolean" },
    "value": "true"
}
```
