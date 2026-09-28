# \<x-property>

Declares one of a component's inputs — an entry point exposed as a read-only, callable signal in the template (`level()`) and in the component's own script (`drx.component.props.level()`). Use it whenever a component needs data from its consumer, instead of hardcoding a value or relying on a variable declared inside the component itself. See [Locals](../concepts/locals.md) for signal call semantics and how properties rank against other locals.

```html
<x-property></x-property>
```

| Attribute | Description                                    |
| --------- | ----------------------------------------------- |
| **name**  | Name of the property                             |
| type?     | Type used to validate the value, defaults to `any` |

## Examples

### Passing a property to a component

```html drx
<x-app>
    <x-component name="alert">
        <x-property name="level" type="string"></x-property>
        <div class="alert" class.critical="level() === 'error'">{{level()}}</div>
    </x-component>

    <x-component-instance component="alert" level="error"></x-component-instance>
</x-app>
```

### Optional properties

A property the consumer doesn't pass is `undefined`, so it can be given a fallback in the template.

```html drx
<x-app>
    <x-component name="greeting">
        <x-property name="name" type="string"></x-property>
        <p>Hello {{name() ?? 'stranger'}}</p>
    </x-component>

    <x-component-instance component="greeting" name="Ada"></x-component-instance>
    <x-component-instance component="greeting"></x-component-instance>
</x-app>
```

### Reading a property from a component script

Outside a template, a property is read through `drx.component.props.<name>()` rather than called directly like the template-local signal above.

```html drx
<x-app>
    <x-component name="alert">
        <x-property name="text" type="string"></x-property>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                log() { console.log(drx.component.props.text()); }
            });
        </script>

        <button onclick="log()">Log text</button>
    </x-component>

    <x-component-instance component="alert" text="Disk space low"></x-component-instance>
</x-app>
```
