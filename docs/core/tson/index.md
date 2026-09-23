# TSON

TSON (Typed JSON) is a schema system for describing and validating JSON-shaped data — plain JSON objects that describe a type, paired with a parser that checks a value against that shape and either returns the value or a list of errors.

A definition is plain, serializable JSON with a `type` field — nothing to import or construct to write one by hand. Edit the value below and the result updates live:

```json tson
{
    "definition": { "type": "enum", "flags": ["low", "medium", "high"] },
    "value": "medium"
}
```

## Types

- [`any`](any.md)
- [`string`](string.md)
- [`number`](number.md)
- [`boolean`](boolean.md)
- [`object`](object.md)
- [`array`](array.md)
- [`record`](record.md)
- [`enum`](enum.md)
- [`union`](union.md)
- [`ref`](ref.md)
