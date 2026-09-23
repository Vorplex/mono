# \<x-app>

The composition root of a DRX document — exactly one per file, everything else declares or renders inside it. Use it to hold app-wide declarations (variables, services, types, apis) and any persistent shell UI (nav, layout) that should mount once regardless of which page is active.

```html
<x-app>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { }
            onUnmount() { }
        });
    </script>
    <style></style>
    <x-packages></x-packages>
    <x-dependency-tree></x-dependency-tree>
    <x-pwa-metadata></x-pwa-metadata>
    <x-type></x-type>
    <x-variable></x-variable>
    <x-service></x-service>
    <x-asset></x-asset>
    <x-api></x-api>
    <x-component></x-component>
    <x-page></x-page>

    <!-- Template -->
</x-app>
```

| Attribute | Description     |
| --------- | --------------- |
| name?     | Name of the app |

## Example
```html drx
<x-app name="dashboardApp">
    <h1>Home</h1>
</x-app>
```

## Scripting

`<x-app>`'s script is instantiated once, when the app mounts.

```ts
export default DRX.defineApp(drx => class {
    onMount() { }
    onUnmount() { }
});
```

### Lifecycle

| Hook          | Called                                           |
| ------------- | ------------------------------------------------ |
| `onMount()`   | Once, right after the app's template has mounted |
| `onUnmount()` | When the app unmounts                            |

### The `drx` parameter

```ts
interface Drx {
    app: {
        /** This app's own <x-variable> declarations, keyed by name. */
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
    };

    /** Every <x-api> declared on this app, keyed by name. */
    apis: Record<string, Record<string, {
        request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
            raw: Response;
            value(): Promise<any>;
        }>;
    }>>;

    /** Every <x-service> declared on this app, keyed by name; each value is that service's own instance. */
    services: Record<string, Record<string, (...args: any[]) => any>>;

    router: {
        readonly route: string;
        /** Always {} at script level -- read live params from the template's `router.params` instead. */
        readonly params: Record<string, string>;
        active(path: string): boolean;
        navigate(path: string): void;
    };

    /** Every <x-page> declared on this app, keyed by name. */
    pages: Record<string, {
        showModal(options?: { data?: any }): Promise<any>;
    }>;
}
```

### Calling script methods from the template

App script methods are callable bare from the app's own template, and from every page's template too (pages share the app's ambient context), without going through `drx.app.instance`:

```html drx
<x-app>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            greet() { console.log('Hello from the app'); }
        });
    </script>

    <button onclick="greet()">Greet</button>
</x-app>
```
