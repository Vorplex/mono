# \<x-event>

Declares one of a component's outputs — an exit point the component fires via `drx.component.events.<name>.emit(payload?)`, caught by a matching handler attribute on the consumer's `<x-component-instance>`. Use it whenever a component needs to notify its consumer of something happening inside it, instead of reaching outside its own isolation.

```html
<x-event></x-event>
```

| Attribute | Description                                    |
| --------- | ----------------------------------------------- |
| **name**  | Name of the event                                |
| type?     | Type used to validate the payload, defaults to `any` |

## Example
```html drx
<x-app>
    <x-component name="alert">
        <x-event name="dismissed" type="string"></x-event>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                dismiss() { drx.component.events.dismissed.emit('dismissed by user'); }
            });
        </script>

        <button onclick="dismiss()">Dismiss</button>
    </x-component>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onAlertDismissed(reason) { console.log(reason); }
        });
    </script>

    <x-component-instance component="alert" dismissed="onAlertDismissed(event)"></x-component-instance>
</x-app>
```
