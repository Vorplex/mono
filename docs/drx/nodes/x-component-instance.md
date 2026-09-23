# \<x-component-instance>

Instantiates a declared `<x-component>` by name. Use it wherever you need to drop a reusable component into a template, wiring its declared properties and events through plain attributes. See [Locals](../concepts/locals.md#resets) for exactly what does (and doesn't) carry over into the instance.

```html
<x-component-instance></x-component-instance>
```

| Attribute      | Description                                       |
| -------------- | ------------------------------------------------- |
| **{ƒ} component** | Name of the component to instantiate                      |
| ...               | Binds to a declared `x-property` ({ƒ}) or `x-event` ((ƒ)) |

## Example
```html drx
<x-app>
    <x-component name="alert">
        <x-property name="text" type="string"></x-property>
        <div class="alert">{{text()}}</div>
    </x-component>

    <x-component-instance component="alert" text="Disk space low"></x-component-instance>
</x-app>
```
