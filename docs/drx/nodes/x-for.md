# \<x-for>

Renders its children once per entry in a collection. Use it for any list-driven UI where the number of rendered items tracks a reactive array or object.

```html
<x-for>
    <!-- Template -->
</x-for>
```

| Attribute    | Description                                                |
| ------------ | ---------------------------------------------------------- |
| **(ƒ) each** | Expression resolving to the collection to iterate          |
| **as**       | Name each item is exposed as within the template           |
| index?       | Name the item's index is exposed as                        |
| key?         | Name the item's key is exposed as                          |
| track?       | Property path used to identify each item across re-renders |

## Example
```html drx
<x-app>
    <x-variable name="items" type="array">["Milk", "Eggs", "Bread"]</x-variable>
    <x-for each="items()" as="item">
        <li>{{item()}}</li>
    </x-for>
</x-app>
```
