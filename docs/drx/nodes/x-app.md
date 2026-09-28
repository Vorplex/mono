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

## Shadow DOM

The app renders its markup into its own open shadow root, and every page and component inside it renders into a shadow root of its own. Each shadow root is a boundary:

- **CSS rules don't cross it.** That's why each `<style>` only styles its owner's markup. Inherited values — custom properties, `font`, `color` — do cross it.
- **`document.querySelector` doesn't see inside it.** Reach the app's elements through its shadow root: `document.querySelector('x-app').shadowRoot`.
- **Events are retargeted.** A listener on `document` sees the host element as `event.target`; use `event.composedPath()` to find the element that was actually clicked.
- **Ids are scoped.** An id only has to be unique within one shadow root; look it up on that root.

```html drx
<x-app>
    <x-variable name="clicked" type="string">"nothing yet"</x-variable>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() {
                document.addEventListener('click', event => {
                    const target = event.composedPath()[0] as HTMLElement;
                    drx.app.variables.clicked.set(`${target.tagName.toLowerCase()} (event.target was ${(event.target as HTMLElement).tagName.toLowerCase()})`);
                });
            }
        });
    </script>

    <button>Click me</button>
    <p>Last clicked: {{clicked()}}</p>
</x-app>
```

## Styling

Styles live next to what consumes them. The app owns the document, so the app's `<style>` is the place for document-wide concerns: design tokens on `:root`, margins and background on `html`/`body`, fonts and the modal backdrop. Don't add styles to the document `<head>`.

| The app's `<style>` applies to | |
| --- | --- |
| The document (`:root`, `html`, `body`, `::backdrop`) | Yes |
| The app's own markup | Yes |
| Every page, including pages opened as modals | Yes |
| Components | No — they only inherit values such as custom properties, `font` and `color` |

- Rules only match markup in the template they're written for plus its pages: `.layout > .sidebar` in the app style doesn't match a `.sidebar` inside a page, because the page's markup belongs to the page. Style an element from the owner whose template contains it, or with a shared class.
- A page's own rules win over the app's at equal specificity.
- `@keyframes` in the app style work in the app and its pages; a component declares its own.
- `@font-face` and `@property` work in any `<style>`.
- `{{ }}` works in a `<style>` with the owner's locals, and the styles update when those change: `:root { --accent: {{accent()}}; }`, or `src: url({{asset.inter}})` for a font bundled as an [`<x-asset>`](x-asset.md). Per-element values belong in `style.<property>` bindings.
- CSS that a library injects into the document `<head>` applies everywhere, as on any web page; your own styles win over it at equal specificity.
- Pages and components are rendered as `display: contents`, so their top-level elements take part directly in the app's layout, e.g. as grid items.

```html drx
<x-app>
    <x-variable name="accent" type="string">"#0f766e"</x-variable>
    <style>
        :root { --accent: {{accent()}}; --radius: 8px; }
        body { margin: 0; padding: 16px; background: #f7f5f0; font-family: system-ui, sans-serif; }
        .card { background: white; border-radius: var(--radius); padding: 12px; margin-bottom: 8px; }
    </style>

    <x-page name="summary">
        <div class="card">A page uses the app's .card class</div>
    </x-page>

    <x-component name="badge">
        <style>.badge { color: var(--accent); font-weight: 600; }</style>
        <span class="badge">A component inherits the --accent token, not the .card class</span>
    </x-component>

    <x-page-container page="summary"></x-page-container>
    <x-component-instance component="badge"></x-component-instance>
    <button onclick="accent(value => value === '#0f766e' ? '#b45309' : '#0f766e')">Switch accent</button>
</x-app>
```

## Scripting

`<x-app>`'s script is instantiated once, when the app mounts. A syntax error in any script stops the app from starting; the error names the script and line, e.g. `script://pages/orders.ts:3:18`.

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
            /** Calls back with the current value immediately and on every change; returns an unsubscribe function. Subscriptions end automatically when the owner unmounts. */
            subscribe(callback: (value: any) => void): () => void;
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
        /** Always {} for the app -- pages mounted under an <x-route> receive its params. */
        readonly params: Record<string, string>;
        /** Prefix match by default, exact when `exact` is true. Paths starting with . are relative to the enclosing route. */
        active(path: string, exact?: boolean): boolean;
        /** Paths starting with . are relative to the enclosing route. */
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
