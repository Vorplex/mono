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

## Shadow DOM

Every component instance renders its markup into its own open shadow root. That boundary is what isolates the component: outside rules can't reach in, its rules can't leak out, and each instance has its own ids.

- **CSS rules don't cross it**; inherited values (custom properties, `font`, `color`) do.
- **Query the instance's own markup through `drx.component.root`** — each instance has its own root, so two instances never find each other's elements.
- **Events from inside are retargeted** at document level; use `event.composedPath()` there.

```html drx
<x-app>
    <x-component name="field">
        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                focusInput() { (drx.component.root.getElementById('input') as HTMLInputElement).focus(); }
            });
        </script>
        <p><input id="input"> <button onclick="focusInput()">Focus</button></p>
    </x-component>

    <x-component-instance component="field"></x-component-instance>
    <x-component-instance component="field"></x-component-instance>
</x-app>
```

## Styling

A component is styled only by its own `<style>`, which is what makes it safe to reuse: app and page rules never reach its markup, and its rules never leak out.

| Reaches a component's markup | |
| --- | --- |
| The component's own `<style>` | Yes |
| App and page `<style>` rules | No |
| Inherited values from where it's placed: custom properties, `font`, `color` | Yes |
| CSS a library injects into the document `<head>` | Yes |

- Use the app's tokens (`var(--accent)`) to match its design without depending on its classes.
- Set `font-family` on the component's own elements to keep its font wherever it's used; otherwise it inherits the font of its surroundings.
- `@font-face` and `@property` in a component's style work, so a component can bring its own font.
- `{{ }}` works in a component's style with its locals, including properties: `.badge { background: {{tone()}}; }`.
- Declare the `@keyframes` a component uses in its own style.
- `:root`, `html` and `body` match nothing in a component's style.
- A component is rendered as `display: contents`; give its markup a root element to control its own layout.

```html drx
<x-app>
    <style>
        :root { --accent: #0f766e; }
        body { font-family: Georgia, serif; }
        .label { color: red; }
    </style>

    <x-component name="badge">
        <style>
            .badge { font-family: system-ui, sans-serif; }
            .label { color: var(--accent); font-weight: 600; }
        </style>
        <span class="badge"><span class="label">Component: own font, app token, not the app's red</span></span>
    </x-component>

    <p class="label">App label: red, inherited font</p>
    <x-component-instance component="badge"></x-component-instance>
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
            /** Calls back with the current value immediately and on every change; returns an unsubscribe function. Subscriptions end automatically when the owner unmounts. */
            subscribe(callback: (value: any) => void): () => void;
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
                increment() { drx.component.variables.count.set(value => value + 1); }
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
