# \<x-libraries>

Declares the DRX libraries an app or library uses. Use it to share components, types, variables, services, apis and assets across apps from a single source instead of copying them. Only the top level declares libraries, at most one `<x-libraries>`; every page and component uses them.

```html
<x-libraries></x-libraries>
```

No attributes, content is a JSON array of absolute library URLs.

The playgrounds on this page serve their extra files at `https://drx.playground/`, so the `ui/index.html` tab is the library at `https://drx.playground/ui/`.

## Example
```html drx
<x-app>
    <x-libraries>["https://drx.playground/ui/"]</x-libraries>

    <x-variable name="tone" type="ui.tone">"info"</x-variable>

    <x-component-instance component="ui.badge" label="Badge from the library" tone="{{tone()}}"></x-component-instance>
    <x-component-instance component="ui.card" title="Card from the library"></x-component-instance>
    <p>
        <button onclick="ui.clicks(value => value + 1)">Click</button>
        <button onclick="tone(value => value === 'info' ? 'danger' : 'info')">Switch tone</button>
        {{ui.clicks()}} clicks, shared with every consumer of the library
    </p>
</x-app>
```

```html drx file=ui/index.html
<x-library name="ui">
    <x-type name="tone">{ "type": "enum", "flags": ["info", "success", "danger"] }</x-type>
    <x-variable name="clicks" type="number">0</x-variable>

    <x-component name="badge">
        <x-property name="label" type="string"></x-property>
        <x-property name="tone" type="string"></x-property>
        <style>
            .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; }
            .info { background: #dbeafe; color: #1e40af; }
            .success { background: #dcfce7; color: #166534; }
            .danger { background: #fee2e2; color: #991b1b; }
        </style>
        <span class="badge {{tone() ?? 'info'}}">{{label()}}</span>
    </x-component>

    <x-component name="card">
        <x-property name="title" type="string"></x-property>
        <style>.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; margin: 8px 0; }</style>
        <div class="card">
            <strong>{{title()}}</strong>
            <x-component-instance component="badge" label="The library's own badge" tone="success"></x-component-instance>
        </div>
    </x-component>
</x-library>
```

## Libraries

A library is a `<x-library>` instead of an `<x-app>`. It declares types, variables, services, apis, assets, components, packages and its own libraries, but no template, pages, script or PWA metadata. Its `name` is required, [camelCase](../concepts/naming.md), and is the name every consumer uses it by.

```html
<x-library name="ui"></x-library>
```

| A consumer can use | From the library's top level                                              |
| ------------------ | ------------------------------------------------------------------------- |
| Components         | `<x-component-instance component="ui.button">`                            |
| Types              | `type="ui.priority"`, or `{ "type": "ref", "id": "ui.priority" }` in TSON |
| Variables          | `ui.theme()` in templates, `drx.libraries.ui.variables.theme` in scripts  |
| Services           | `drx.libraries.ui.services.logger.log(...)`                               |
| Apis               | `drx.libraries.ui.apis.todoApi.endpoints.list.request()`                  |
| Assets             | `ui.asset.logo`                                                           |

- **Only the top level is exported.** Components, types and the rest declared inside a library component stay private to that component.
- **One instance.** A library's variables and services exist once per running app, however many pages, components and other libraries use it. `ui.theme()` is the same signal everywhere.
- **A library resolves inside itself.** Inside a library, `component="button"` gets the library's own `button`, never one declared by the consumer, and `icons.star` uses the library's own `<x-libraries>`, never the consumer's.
- **Plain names never reach a library.** `component="button"` only finds the consumer's own components; a library member always needs the library name.
- **Library names are unique.** Every library loaded into an app, directly or through another library, needs a different name. A second library with a name that's already loaded is reported and never loaded.

## Scope

A library declared on the app is usable everywhere in it: the app's template and script, every page, every component however deeply nested, and every service. Declare it once; components never declare their own.

```html drx
<x-app>
    <x-libraries>["https://drx.playground/ui/"]</x-libraries>

    <x-component name="card">
        <x-component name="title">
            <x-component-instance component="ui.badge" label="Nested inside card, using the app's library"></x-component-instance>
        </x-component>
        <x-component-instance component="title"></x-component-instance>
    </x-component>

    <x-component-instance component="card"></x-component-instance>
</x-app>
```

```html drx file=ui/index.html
<x-library name="ui">
    <x-component name="badge">
        <x-property name="label" type="string"></x-property>
        <span style="padding: 2px 10px; border-radius: 999px; background: #dbeafe;">{{label()}}</span>
    </x-component>
</x-library>
```

## URLs

- **A URL must be absolute**, such as `https://cdn.jsdelivr.net/npm/@acme/ui@1.2.0/`. A relative URL is reported and never loaded, so a library means the same thing wherever it's declared and wherever the app is split into files.
- **A URL is a folder or an `.html` file.** A folder loads its `index.html`.
- **A query string carries over** to the library's own imports and relative assets on the same host, so `?ref=main` or an access token reaches every file of the library.
- **The URL is the version.** `@1.2.0`, a git tag or a commit in the URL pins it; `@latest`, a branch or a local folder follows the latest. DRX never interprets versions.
- **Each URL loads once.** Two owners pointing at the same URL share it.
- **Relative asset URLs resolve against the library file that declares them**, so a library can ship its own files. See [`<x-asset>`](x-asset.md).

## Scripting

Scripts reach a library's variables, services and apis through `drx.libraries.<name>`, available to the app, its pages, components and services. A library's own top-level services reach the library's variables through `drx.library`, where an app's services use `drx.app`.

```html drx
<x-app>
    <x-libraries>["https://drx.playground/ui/"]</x-libraries>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() {
                drx.libraries.ui.variables.greeting.set('Hello from the app');
                console.log(drx.libraries.ui.services.formatter.shout());
            }
        });
    </script>
    <p>{{ui.greeting()}}</p>
</x-app>
```

```html drx file=ui/index.html
<x-library name="ui">
    <x-variable name="greeting" type="string">"Hello"</x-variable>
    <x-service name="formatter">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                shout() { return drx.library.variables.greeting.get().toUpperCase() + '!'; }
            });
        </script>
    </x-service>
</x-library>
```

## Names

A library's name must not clash with an app variable. `asset`, `router` and `modal` are reserved.
