# `string`

```ts
interface TsonStringDefinition {
    type: 'string';
    min?: number;
    max?: number;
    match?: string;
    default?: { value: string };
}
```

| Field | Description |
| --- | --- |
| min? | Minimum length |
| max? | Maximum length |
| match? | A regex source the value must match |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "string", "min": 3, "max": 40 },
    "value": "hi"
}
```
