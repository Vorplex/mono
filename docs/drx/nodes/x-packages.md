# \<x-packages>

Declares npm package versions available to a script's bare imports. Use it when an app or component's `<script>` needs a third-party dependency, at most one per app/component.

```html
<x-packages></x-packages>
```

No attributes, content is a JSON object of package name to version.

## Example
```html drx
<x-app>
    <x-packages>{ "lodash": "^4.17.21" }</x-packages>

    <script type="application/typescript">
        import { upperCase } from 'lodash';

        export default DRX.defineApp(drx => class {
            onMount() { console.log(upperCase('drx packages are working')); }
        });
    </script>
</x-app>
```
