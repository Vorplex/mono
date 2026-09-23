# \<x-asset>

Declares a static asset, resolved via `asset.<name>` to a plain URL string. Use it for images, icons, or other files bundled with the app instead of hardcoding paths or embedding data URIs inline in markup.

```html
<x-asset></x-asset>
```

| Attribute | Description                                                 |
| --------- | ----------------------------------------------------------- |
| **name**  | Name of the asset                                           |
| src?      | URL of an external asset; omit to declare an internal asset |
| type?     | MIME type of an internal asset                              |

## Example
```html drx
<x-app>
    <x-asset name="logo" src="https://www.google.com/favicon.ico"></x-asset>

    <img src="{{asset.logo}}" />
</x-app>
```
