# \<x-icon>

Mounts as an `<svg>`, resolving `name` against the built-in icon set. Use it instead of inlining raw SVG markup or an `<x-asset>` image whenever a built-in icon covers the need.

```html
<x-icon></x-icon>
```

| Attribute | Description                                                          |
| --------- | ---------------------------------------------------------------------|
| **{ƒ} name** | Name of the icon to render                                           |
| ...       | Any other attribute binds as an expression to the underlying `<svg>` |

## Example
```html drx
<x-app>
    <x-variable name="expanded" type="boolean">false</x-variable>
    <x-icon name="{{expanded() ? 'chevron-up' : 'chevron-down'}}"></x-icon>
</x-app>
```
