# \<x-component-instance>

Instantiates a declared `<x-component>` by name. Use it wherever you need to drop a reusable component into a template, wiring its declared properties and events through plain attributes. See [Locals](../concepts/locals.md#resets) for exactly what does (and doesn't) carry over into the instance.

```html
<x-component-instance></x-component-instance>
```

| Attribute         | Description                                               |
| ----------------- | --------------------------------------------------------- |
| **{ƒ} component** | Name of the component to instantiate                      |
| ...               | Binds to a declared `x-property` ({ƒ}) or `x-event` ((ƒ)) |

## Resolution

`component` is resolved where the instance is written, not where it ends up rendered:

- **A plain name** looks at the components declared directly inside the current component, then directly inside each component enclosing it, then directly inside the app. The nearest match wins; each level only searches its direct children, never deeper.
- **A namespaced name** such as `ui.button` finds the nearest [`<x-libraries>`](x-libraries.md) declaring `ui` and takes that library's top-level `button`.

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
