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
        <button onclick="count(count() + 1)">Clicked {{count()}} times</button>
    </x-page>

    <x-page-container page="home"></x-page-container>
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
        }>;
        /** This page's shadow root. */
        root: ShadowRoot;
    };

    /** Every <x-api> declared on the app, keyed by name. */
    apis: Record<string, Record<string, {
        request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
            raw: Response;
            value(): Promise<any>;
        }>;
    }>>;

    /** Every <x-service> declared on the app, keyed by name; each value is that service's own instance. */
    services: Record<string, Record<string, (...args: any[]) => any>>;

    router: {
        readonly route: string;
        /** Always {} at script level -- read live params from the template's `router.params` instead. */
        readonly params: Record<string, string>;
        active(path: string): boolean;
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
                increment() { drx.page.variables.count.set(drx.page.variables.count.get() + 1); }
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
