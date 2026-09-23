# \<x-variable>

Declares reactive state, exposed as a callable signal (`count()` reads, `count(value)` writes). Use it anywhere a template or script needs to read or mutate a value over time, scoped to whichever app/page/component declares it. See [Locals](../concepts/locals.md) for signal call semantics and how variables rank against other locals.

```html
<x-variable></x-variable>
```

| Attribute | Description                                        |
| --------- | -------------------------------------------------- |
| **name**  | Name of the variable                               |
| type?     | Type used to validate the value, defaults to `any` |

## Examples

### Using a variable in a template

```html drx
<x-app>
    <x-variable name="count" type="number">0</x-variable>
    <button onclick="count(count() + 1)">Clicked {{count()}} times</button>
</x-app>
```

### Reading and writing a variable from a script

Outside a template, a variable is read and written through `drx.*.variables.<name>.get()`/`.set(...)` — see [App scripting](x-app.md#the-drx-parameter) — rather than called directly like the template-local signal above.

```html drx
<x-app>
    <x-variable name="theme" type="string">"light"</x-variable>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            toggleTheme() {
                const current = drx.app.variables.theme.get();
                drx.app.variables.theme.set(current === 'light' ? 'dark' : 'light');
            }
        });
    </script>

    <p>Theme: {{theme()}}</p>
</x-app>
```
