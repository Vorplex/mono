# \<x-service>

A plain class for behavior not tied to one page or component, reached via `drx.services.<name>.<method>(...)`. Use it to share logic (logging, analytics, formatting helpers) across pages/components without duplicating it or forcing an unrelated owner on it.

```html
<x-service>
    <script type="application/typescript">
        export default DRX.defineService(drx => class {
            method() { }
        });
    </script>
</x-service>
```

| Attribute | Description         |
| --------- | ------------------- |
| **name**  | Name of the service |

## Example
```html drx
<x-app>
    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                log(message) { console.log(message); }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.log('App mounted'); }
        });
    </script>
</x-app>
```

## Scripting

`<x-service>` is a plain class, not tied to one page or component. It has no template and no shadow root, and it is only ever constructed with `new` — never mounted.

```ts
export default DRX.defineService(drx => class {
    method() { }
});
```

### Lifecycle

None. `onMount()`/`onUnmount()` are never called on a service instance and should not be declared on one.

### The `drx` parameter

```ts
interface Drx {
    /** Every <x-api> declared on the same owner (app or component), keyed by name. */
    apis: Record<string, Record<string, {
        request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
            raw: Response;
            value(): Promise<any>;
        }>;
    }>>;

    /** Every sibling <x-service> declared on the same owner (app or component), keyed by name. */
    services: Record<string, Record<string, (...args: any[]) => any>>;
}
```

A service has no `drx.app`, `drx.page`, `drx.component`, `drx.router`, or `drx.modal` — it's reached only through the methods it exposes, never the other way around.

### Calling script methods from the template

Not applicable — a service has no template of its own. Its methods are reached from an app, page, or component script via `drx.services.<name>.<method>(...)`.

### Examples

#### An app script calling a service

Calls a declared `<x-service>` from the app's own `onMount()`.

```html drx
<x-app>
    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                log(message) { console.log(message); }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.log('App mounted'); }
        });
    </script>
</x-app>
```

#### A component using its own service

Calls a `<x-service>` declared inside the component itself, from the component's own `onMount()`. That service is only reachable from this component's own script — not from the app or from other components.

```html drx
<x-app>
    <x-component name="widget">
        <x-service name="widgetLogger">
            <script type="application/typescript">
                export default DRX.defineService(drx => class {
                    log(message) { console.log(message); }
                });
            </script>
        </x-service>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                onMount() { drx.services.widgetLogger.log('Widget mounted'); }
            });
        </script>

        <div>Widget</div>
    </x-component>

    <x-component-instance component="widget"></x-component-instance>
</x-app>
```

#### A service calling another service

`logger` reaches its sibling `formatter` via `drx.services`, since both are declared on the same app.

```html drx
<x-app>
    <x-service name="formatter">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                currency(amount) { return `$${amount.toFixed(2)}`; }
            });
        </script>
    </x-service>

    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                logPrice(amount) { console.log(drx.services.formatter.currency(amount)); }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.logPrice(19.9); }
        });
    </script>
</x-app>
```

#### A service calling a declared api

`logger` reaches the app-level `todoApi` via `drx.apis`, since both are declared on the same app.

```html drx
<x-app>
    <x-api name="todoApi" url="https://api.example.com">
        <x-endpoint name="list" path="/todos" method="GET">
            <x-response type="array"></x-response>
        </x-endpoint>
    </x-api>

    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                async logTodos() {
                    const response = await drx.apis.todoApi.list.request();
                    console.log(await response.value());
                }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.logTodos(); }
        });
    </script>
</x-app>
```
