# `any`

No constraints — any non-`null`/`undefined` value passes through unchanged. `type="any"` is also the natural fallback whenever no type is declared at all.

```ts
interface TsonAnyDefinition {
    type: 'any';
    default?: { value: any };
}
```

```json tson
{
    "definition": { "type": "any" },
    "value": { "anything": "goes" }
}
```
