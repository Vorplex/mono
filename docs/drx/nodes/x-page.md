# \<x-page>

A distinct screen, reachable via `<x-route>`, embedded via `<x-page-container>`, or opened as a modal with `drx.pages.<name>.showModal(...)`. Use it for anything that's a targetable destination in its own right, as opposed to a reusable, isolated unit (that's what `<x-component>` is for).

```html
<x-page>
    <script type="application/typescript">
        export default DRX.definePage(drx => class {
            onMount() { }
            onUnmount() { }
        });
    </script>
    <style></style>
    <x-variable></x-variable>

    <!-- Template -->
</x-page>
```

| Attribute | Description      |
| --------- | ---------------- |
| **name**  | Name of the page |

## Example
```html drx
<x-app>
    <x-page name="home">
        <x-variable name="count" type="number">0</x-variable>
        <button onclick="count(value => value + 1)">Clicked {{count()}} times</button>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```

## Shadow DOM

A page renders its markup into its own open shadow root, inside the app's. That boundary is what keeps page styles from reaching other pages, and it shapes how a page script finds its elements:

- **CSS rules don't cross it**; inherited values (custom properties, `font`, `color`) do.
- **Query the page's own markup through `drx.page.root`**, not `document` — `document.querySelector` can't see inside the page.
- **Ids are scoped to the page**, so `drx.page.root.getElementById(...)` finds them even if another page uses the same id.
- **Events from inside the page are retargeted** at document level; use `event.composedPath()` there.

```html drx
<x-app>
    <x-page name="panel">
        <x-variable name="width" type="number">0</x-variable>
        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                measure() { drx.page.variables.width.set(Math.round(drx.page.root.getElementById('box').getBoundingClientRect().width)); }
            });
        </script>
        <div id="box" style="width: 60%; padding: 8px; background: #e0f2f1">Resize the window, then measure</div>
        <p><button onclick="measure()">Measure</button> {{width()}}px</p>
    </x-page>

    <x-page-container page="panel"></x-page-container>
</x-app>
```

## Styling

A page's `<style>` applies only to that page's own markup, so the same class name can mean different things on different pages. A page also receives the app's style and inherits the app's tokens and fonts.

| Reaches a page's markup | |
| --- | --- |
| The app's `<style>` | Yes |
| The page's own `<style>` | Yes — wins over the app's rules at equal specificity |
| Other pages' styles, including pages it embeds | No |
| CSS a library injects into the document `<head>` | Yes |

- A page's rules don't reach components placed on it or pages embedded in it with `<x-page-container>`.
- `:root`, `html` and `body` belong to the app; in a page's style they match nothing.
- `@font-face` and `@property` work in a page's style.
- `{{ }}` works in a page's style with the page's locals: `.title { font-size: {{size()}}px; }`.
- A page is rendered as `display: contents`, so its top-level elements take part directly in the layout of wherever the page is placed. Position the page with a class on its own root element.

```html drx
<x-app>
    <style>.title { font-family: Georgia, serif; }</style>

    <x-page name="first">
        <style>.title { color: #0f766e; }</style>
        <h2 class="title">First page title</h2>
    </x-page>

    <x-page name="second">
        <style>.title { color: #b45309; }</style>
        <h2 class="title">Second page title</h2>
    </x-page>

    <x-page-container page="first"></x-page-container>
    <x-page-container page="second"></x-page-container>
</x-app>
```

## Scripting

`<x-page>`'s script is instantiated fresh each time that page mounts — every time it's routed to, embedded via `<x-page-container>`, or opened with `.showModal(...)`.

```ts
export default DRX.definePage(drx => class {
    onMount() { }
    onUnmount() { }
});
```

### Lifecycle

| Hook          | Called                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `onMount()`   | Once, right after this page instance's own template has mounted                                                   |
| `onUnmount()` | When this instance of the page unmounts (e.g. a `<x-page-container>`'s `page` changes, or a route stops matching) |

### The `drx` parameter

```ts
interface Drx {
    app: {
        /** The app's own <x-variable> declarations, keyed by name. */
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
        /** The app script's own class instance -- call its methods directly. */
        instance: any;
    };

    page: {
        /** This page's own <x-variable> declarations, keyed by name. */
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
        /** This page's shadow root. */
        root: ShadowRoot;
    };

    /** Every <x-api> declared on the app, keyed by name. */
    apis: Record<string, {
        /** The api's base url. */
        url: string;
        endpoints: Record<string, {
            request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
                raw: Response;
                value(): Promise<any>;
            }>;
        }>;
    }>;

    /** Every <x-service> declared on the app, keyed by name; each value is that service's own instance. */
    services: Record<string, Record<string, (...args: any[]) => any>>;

    router: {
        readonly route: string;
        /** Params of the <x-route> this page is mounted under. */
        readonly params: Record<string, string>;
        /** Prefix match by default, exact when `exact` is true. Paths starting with . are relative to the enclosing route. */
        active(path: string, exact?: boolean): boolean;
        /** Paths starting with . are relative to the enclosing route. */
        navigate(path: string): void;
    };

    /** Every <x-page> declared on the app, keyed by name. */
    pages: Record<string, {
        showModal(options?: { data?: any }): Promise<any>;
    }>;

    /** Only present when this page instance was opened via `.showModal(...)`. Calling it otherwise throws. */
    modal?: {
        data(): any;
        close(result?: any): void;
    };
}
```

### Examples

### Calling script methods from the template

Any method on the page's own class is callable bare from that page's own template — in `{{ }}` expressions and in plain attributes like `onclick`. The app's own script methods are reachable the same way too, since a page shares the app's ambient context (unlike a fully isolated component) — a page's own method of the same name takes priority.

A button's `onclick` calls a method declared directly on the page's own script:

```html drx
<x-app>
    <x-page name="home">
        <x-variable name="count" type="number">0</x-variable>

        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                increment() { drx.page.variables.count.set(value => value + 1); }
            });
        </script>

        <button onclick="increment()">Clicked {{count()}} times</button>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```

#### A page script calling an app instance function

Reaches the app script's instance via `drx.app.instance` to call a method declared on the app, not the page.

```html drx
<x-app>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            trackVisit(pageName) { console.log(`Visited ${pageName}`); }
        });
    </script>

    <x-page name="home">
        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                onMount() { drx.app.instance.trackVisit('home'); }
            });
        </script>
        <h1>Home</h1>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```

#### A modal page

Opens a page as a modal with `showModal({ data })`, reads the data it was opened with via `drx.modal.data()`, and resolves the caller's promise via `drx.modal.close(...)` — here, a form that edits a record and hands the edited copy back.

```html drx
<x-app>
    <x-page name="editPerson">
        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                save() { drx.modal.close(drx.modal.data()); }
            });
        </script>

        <label>
            Name
            <input value="{{modal.data.name()}}" onchange="modal.data.name(event.target.value)">
        </label>
        <label>
            Age
            <input type="number" value="{{modal.data.age()}}" onchange="modal.data.age(Number(event.target.value))">
        </label>
        <button onclick="modal.close()">Cancel</button>
        <button onclick="save()">Save</button>
    </x-page>

    <x-page name="home">
        <x-variable name="person" type="any">{ "name": "Ada Lovelace", "age": 30 }</x-variable>

        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                async edit() {
                    const result = await drx.pages.editPerson.showModal({ data: drx.page.variables.person.get() });
                    if (result) drx.page.variables.person.set(result);
                }
            });
        </script>

        <p>{{person.name()}}, age {{person.age()}}</p>
        <button onclick="edit()">Edit</button>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```
