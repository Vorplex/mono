# \<x-component>

A fully isolated, reusable unit with no access to app, page, or enclosing component state — anything it needs must be redeclared locally or passed in via `<x-property>`/`<x-event>`. Use it once something is genuinely reusable across pages or apps and benefits from that isolation; otherwise prefer `<x-page-container>`.

```html
<x-component>
    <script type="application/typescript">
        export default DRX.defineComponent(drx => class {
            onMount() { }
            onUnmount() { }
        });
    </script>
    <style></style>
    <x-packages></x-packages>
    <x-dependency-tree></x-dependency-tree>
    <x-type></x-type>
    <x-property></x-property>
    <x-event></x-event>
    <x-variable></x-variable>
    <x-service></x-service>
    <x-asset></x-asset>
    <x-api></x-api>
    <x-component></x-component>

    <!-- Template -->
</x-component>
```

| Attribute | Description           |
| --------- | --------------------- |
| **name**  | Name of the component |

## Examples

```html drx
<x-app>
    <x-component name="alert">
        <x-property name="text" type="string"></x-property>
        <div class="alert">{{text()}}</div>
    </x-component>

    <x-component-instance component="alert" text="Disk space low"></x-component-instance>
</x-app>
```

#### Emitting an event from the template

A declared `<x-event>` is also callable bare from the component's own template, same as a script method — no `<script>` needed on either side.

```html drx
<x-app>
    <x-component name="alert">
        <x-event name="dismissed" type="string"></x-event>
        <button onclick="dismissed('dismissed by user')">Dismiss</button>
    </x-component>

    <x-component-instance component="alert" dismissed="console.log(event)"></x-component-instance>
</x-app>
```

## Scripting

`<x-component>`'s script is instantiated once per `<x-component-instance>` that resolves to it. A component is fully isolated: it never receives the enclosing app's or page's state — anything it needs must be declared on the component itself (its own `<x-variable>`, `<x-property>`, `<x-event>`, `<x-service>`, `<x-api>`) or passed in as a prop.

```ts
export default DRX.defineComponent(drx => class {
    onMount() { }
    onUnmount() { }
});
```

### Lifecycle

| Hook          | Called                                                               |
| ------------- | -------------------------------------------------------------------- |
| `onMount()`   | Once, right after this component instance's own template has mounted |
| `onUnmount()` | When this component instance unmounts                                |

### The `drx` parameter

```ts
interface Drx {
    component: {
        /** This component instance's own <x-variable> declarations, keyed by name. */
        variables: Record<string, {
            /** Reads the current value. */
            get(): any;
            /** Writes a new value, or an updater function that receives the current value and returns the next one. */
            set(update: any | ((value: any) => any)): void;
            /** Resets the variable back to its declared initial value. */
            reset(): void;
            /** Validates the current value against the variable's declared type; each error carries a message and a path. */
            validate(): [value: any | undefined, errors: { message: string; path: string }[]];
        }>;
        /** The declared <x-property> values passed in by the consumer, keyed by name. Read-only. */
        props: Record<string, () => any>;
        /** The declared <x-event>s this instance can fire, keyed by name. */
        events: Record<string, { emit(payload?: any): void }>;
        /** This component instance's shadow root. */
        root: ShadowRoot;
    };

    /** Every <x-api> declared on this component itself -- never the enclosing app's. */
    apis: Record<string, Record<string, {
        request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
            raw: Response;
            value(): Promise<any>;
        }>;
    }>>;

    /** Every <x-service> declared on this component itself -- never the enclosing app's. */
    services: Record<string, Record<string, (...args: any[]) => any>>;
}
```

There is no `drx.app`, `drx.page`, `drx.router`, or `drx.modal` — a component script cannot reach any of them, by design.

### Calling script methods from the template

Any method on the component's own class is callable bare from that instance's own template — in `{{ }}` expressions and in plain attributes like `onclick`:

```html
<x-component name="counter">
    <script type="application/typescript">
        export default DRX.defineComponent(drx => class {
            log() { console.log('Hello from the component'); }
        });
    </script>
    <button onclick="log()">Log</button>
</x-component>
```

### Examples

#### An element calling a component function

A button's `onclick` calls a method declared directly on the component's own script.

```html drx
<x-app>
    <x-component name="counter">
        <x-variable name="count" type="number">0</x-variable>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                increment() { drx.component.variables.count.set(drx.component.variables.count.get() + 1); }
            });
        </script>

        <button onclick="increment()">Clicked {{count()}} times</button>
    </x-component>

    <x-component-instance component="counter"></x-component-instance>
</x-app>
```

#### A component emitting an event from a script

A component fires a declared `<x-event>` via `drx.component.events.<name>.emit(payload?)`; the consumer catches it with a plain attribute on the `<x-component-instance>`, matching the event's name.

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
