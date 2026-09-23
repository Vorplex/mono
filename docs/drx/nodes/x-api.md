# \<x-api>

Declares an HTTP client, reached via `drx.apis.<name>.<endpoint>.request(...)`. Use it to centralize a backend's base URL and request/response shapes instead of hand-rolling `fetch` calls throughout scripts.

```html
<x-api>
    <x-type></x-type>
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
```html drx
<x-app>
    <x-api name="todoApi" url="https://api.example.com">
        <x-endpoint name="list" path="/todos" method="GET">
            <x-response type="array"></x-response>
        </x-endpoint>
        <x-endpoint name="remove" path="/todos/{id}" method="DELETE">
            <x-parameter name="id" required="true"></x-parameter>
            <x-header name="authorization" required="true"></x-header>
            <x-body type="any"></x-body>
        </x-endpoint>
    </x-api>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            async onMount() {
                const response = await drx.apis.todoApi.list.request();
                console.log(await response.value());
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

| Attribute | Description                                                |
| --------- | ----------------------------------------------------------|
| type?     | Type used to validate the request body, defaults to `any` |

## \<x-response>

| Attribute | Description                                                 |
| --------- | ------------------------------------------------------------|
| type?     | Type used to validate the response body, defaults to `any` |
