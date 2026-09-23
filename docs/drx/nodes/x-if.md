# \<x-if>

Conditionally renders its children based on a reactive expression. Use it to show or hide part of a template rather than toggling visibility with CSS, since the content isn't mounted at all when the condition is false.

Chain additional branches with nested `<x-else-if>` (repeatable) and `<x-else>` (at most one), in that order, as the last children of `<x-if>`. Only the first branch whose condition is true renders — `<x-if>`'s own content is checked first, then each `<x-else-if>` in order, falling back to `<x-else>` if none match.

```html
<x-if>
    <!-- Template -->
    <x-else-if>
        <!-- Template -->
    </x-else-if>
    <x-else>
        <!-- Template -->
    </x-else>
</x-if>
```

| Attribute        | Description                                      |
| ---------------- | ------------------------------------------------ |
| **(ƒ) condition** | Evaluated to decide whether the template renders |

`<x-else-if>` takes the same **(ƒ) condition** attribute; `<x-else>` takes none.

## Example
```html drx
<x-app>
    <x-variable name="on" type="boolean"></x-variable>
    <button onclick="on(value => !value)">
        Toggle
    </button>
    <x-if condition="on()">
        <p>On</p>
        <x-else-if condition="on() === false">
            <p>Off</p>
        </x-else-if>
        <x-else>
            <p>Unset</p>
        </x-else>
    </x-if>
</x-app>
```
