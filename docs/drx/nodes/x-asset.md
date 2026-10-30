# \<x-asset>

Declares a static asset, resolved via `asset.<name>` to a plain URL string. Use it for images, icons, or other files bundled with the app instead of hardcoding paths or embedding data URIs inline in markup.

```html
<x-asset></x-asset>
```

| Attribute | Description                                                 |
| --------- | ----------------------------------------------------------- |
| **name**  | Name of the asset                                           |
| src?      | URL of an external asset; omit to declare an inline asset   |
| type?     | MIME type of an inline asset                                |

A relative `src` is a file of the app. It resolves against the file it's written in, as in HTML, and is read the same way as an `<x-import>`, so `asset.<name>` serves its content rather than linking to it. If the file can't be read, `asset.<name>` is the file's resolved path: relative to the app for the app's own assets, and an absolute URL for a library's assets.

When an app is split into files, the declaration moves to `app/assets/<name>.html` and the file moves to `assets/<id>.<extension>` next to `index.html`, named by the asset's id so renaming an asset never moves its file. The `src` is rewritten to point at it: `./logo.svg` written in `index.html` becomes `../../assets/<id>.svg` in `app/assets/logo.html`. Absolute URLs are never read or rewritten.

## Example
```html drx
<x-app>
    <x-asset name="logo" src="https://www.google.com/favicon.ico"></x-asset>

    <img src="{{asset.logo}}" />
</x-app>
```

#### A file next to the app

```html drx
<x-app>
    <x-asset name="mark" src="./mark.svg"></x-asset>

    <img src="{{asset.mark}}" width="48" height="48" />
</x-app>
```

```svg drx file=mark.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#0f766e"/></svg>
```
