# \<x-settings>

Declares the app's settings: a JSON object read as the `settings` local in templates and as `drx.settings` in scripts. Use it for values that change between environments, such as API addresses, feature flags or display names, instead of hardcoding them in markup or scripts. At most one per app; a library can't declare settings.

```html
<x-settings></x-settings>
```

| Attribute | Description                                                                      |
| --------- | -------------------------------------------------------------------------------- |
| src?      | Path or URL of a JSON file holding the settings; omit to write the JSON as the content |

The content, or the file at `src`, is a JSON object. `settings` is an empty object when the app declares none.

## Example

```html drx
<x-app>
    <x-settings>{ "title": "Customer portal", "support": { "email": "help@example.com" } }</x-settings>

    <h1>{{settings.title}}</h1>
    <p>Contact {{settings.support.email}}</p>
</x-app>
```

## Settings in a file

A relative `src` resolves against the file it's written in, as with [\<x-import>](x-import.md). An absolute URL such as `https://config.example.com/portal.json` is requested as-is and never rewritten. When an app is split into files, settings with a `src` stay in that file, and `src` is rewritten relative to the file the node moves to. Settings without a `src` move to `settings.json` next to the app's file, and the node becomes `<x-settings src="./settings.json"></x-settings>`.

```html drx
<x-app>
    <x-settings src="./settings.json"></x-settings>

    <p>Environment: {{settings.environment}}</p>
</x-app>
```

```json drx file=settings.json
{
    "environment": "development"
}
```

## Api addresses

An [\<x-api>](x-api.md) `url` is an expression, so it can read its address from the settings:

```html drx
<x-app>
    <x-settings>{ "api": { "url": "https://jsonplaceholder.typicode.com" } }</x-settings>

    <x-api name="jsonPlaceholder" url="{{settings.api.url}}">
        <x-endpoint name="get" path="/todos/1"></x-endpoint>
    </x-api>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            async onMount() {
                console.log(drx.apis.jsonPlaceholder.url);
                const response = await drx.apis.jsonPlaceholder.endpoints.get.request();
                console.log(await response.value());
            }
        });
    </script>
</x-app>
```

## Scripts

App, page, component and service scripts read the same object through `drx.settings`:

```html drx
<x-app>
    <x-settings>{ "greeting": "Hello from settings" }</x-settings>

    <x-service name="greeter">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                greet() { return drx.settings.greeting; }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { console.log(drx.services.greeter.greet()); }
        });
    </script>
</x-app>
```

## Compiled output

A compiled app writes its settings to `settings.json` next to `index.html`, separate from the rest of the app, and loads it before the app renders. Replace that file to change the settings of a deployed app without compiling it again. An installable PWA keeps working offline: its service worker caches `settings.json` with the rest of the app, requests every file from the network first while online, and only serves its cached copies when offline, so a replaced file takes effect on the next online load.
