# \<x-pwa-metadata>

Declares the PWA manifest (name, icons, theme, display mode) for installable/offline support. At most one per app. Use it when the app needs to be installable as a standalone PWA; it only affects exported/deployed output, not the live preview.

```html
<x-pwa-metadata></x-pwa-metadata>
```

No attributes, content is a JSON object matching the [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest).

## Example
```html drx
<x-app>
    <x-pwa-metadata>{ "name": "My App", "short_name": "App", "display": "standalone", "icons": [] }</x-pwa-metadata>

    <h1>Home</h1>
</x-app>
```
