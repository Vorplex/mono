# \<x-page-container>

Embeds another page inline, sharing the host's full app context (not sandboxed like a component instance). Use it for shared layout pieces (header, sidebar, footer) or a content slot that swaps which page it shows, without the prop/event plumbing a component would require. See [Locals](../concepts/locals.md#resets) for exactly which locals the embedded page does and doesn't inherit.

```html
<x-page-container></x-page-container>
```

| Attribute | Description                |
| --------- | -------------------------- |
| **{ƒ} page** | Name of the page to render |

## Example
```html drx
<x-app>
    <x-page name="dashboard">
        <h1>Dashboard</h1>
    </x-page>

    <x-page-container page="dashboard"></x-page-container>
</x-app>
```
