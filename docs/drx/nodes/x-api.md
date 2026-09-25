# \<x-api>

Declares an HTTP client, reached via `drx.apis.<name>.<endpoint>.request(...)`. Use it to centralize a backend's base URL and request/response shapes instead of hand-rolling `fetch` calls throughout scripts.

```html
<x-api>
    <x-endpoint>
        <x-parameter></x-parameter>
        <x-header></x-header>
        <x-body></x-body>
        <x-response></x-response>
    </x-endpoint>
</x-api>
```

| Attribute | Description         |
| --------- | ------------------- |
| **name**  | Name of the api     |
| **url**   | Base url of the api |

## Example

Against the public [JSONPlaceholder](https://jsonplaceholder.typicode.com) API:

```html drx
<x-app>
    <x-type name="Todo">{ "type": "object", "properties": { "userId": { "type": "number" }, "id": { "type": "number" }, "title": { "type": "string" }, "completed": { "type": "boolean" } } }</x-type>

    <x-api name="jsonPlaceholder" url="https://jsonplaceholder.typicode.com">
        <x-endpoint name="list" path="/todos" method="GET">
            <x-response>{ "type": "array", "itemDefinition": { "type": "ref", "id": "Todo" } }</x-response>
        </x-endpoint>
        <x-endpoint name="create" path="/todos" method="POST">
            <x-body>{ "type": "object", "properties": { "userId": { "type": "number" }, "title": { "type": "string" }, "completed": { "type": "boolean" } } }</x-body>
            <x-response>{ "type": "ref", "id": "Todo" }</x-response>
        </x-endpoint>
        <x-endpoint name="remove" path="/todos/{id}" method="DELETE">
            <x-parameter name="id" required="true"></x-parameter>
        </x-endpoint>
    </x-api>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            async onMount() {
                const list = await drx.apis.jsonPlaceholder.list.request();
                console.log(await list.value());

                const created = await drx.apis.jsonPlaceholder.create.request({ body: { userId: 1, title: 'Write docs', completed: false } });
                console.log(await created.value());

                await drx.apis.jsonPlaceholder.remove.request({ parameters: { id: '1' } });
            }
        });
    </script>
    <h1>Todos</h1>
</x-app>
```

## \<x-endpoint>

| Attribute | Description                                           |
| --------- | ----------------------------------------------------- |
| **name**  | Name of the endpoint                                  |
| **path**  | Path appended to the api's url, may include `{param}` |
| method?   | HTTP method, defaults to `GET`                        |

## \<x-parameter>

| Attribute    | Description                                            |
| ------------ | ------------------------------------------------------ |
| **name**     | Name of the query or path parameter                    |
| required?    | Whether the parameter is required, defaults to `false` |
| description? | Description of the parameter                           |

## \<x-header>

| Attribute    | Description                                         |
| ------------ | --------------------------------------------------- |
| **name**     | Name of the header                                  |
| required?    | Whether the header is required, defaults to `false` |
| description? | Description of the header                           |

## \<x-body>

Holds an inline [TSON](../core/tson/index.html) definition, the same JSON-content shape as `<x-type>`, used to validate the request body. Defaults to `{ "type": "any" }` when empty. Its definition may itself be a `{ "type": "ref", "id": "..." }` pointing at a named `<x-type>` declared on the enclosing app or component, if the shape is meant to be shared.

```html
<x-body>{ "type": "object", "properties": { "userId": { "type": "number" }, "title": { "type": "string" }, "completed": { "type": "boolean" } } }</x-body>
```

## \<x-response>

Holds an inline [TSON](../core/tson/index.html) definition, the same JSON-content shape as `<x-type>`, used to validate the response body. Defaults to `{ "type": "any" }` when empty. Its definition may itself be a `{ "type": "ref", "id": "..." }` pointing at a named `<x-type>` declared on the enclosing app or component, if the shape is meant to be shared.

```html
<x-response>{ "type": "ref", "id": "Todo" }</x-response>
```
