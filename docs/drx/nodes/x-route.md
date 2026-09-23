# \<x-route>

Renders its children whenever `route` matches the current URL (partial/prefix by default). Use it for deep-linkable, browser-navigable content instead of a plain variable driving which content shows.

```html
<x-route>
    <!-- Template -->
</x-route>
```

| Attribute | Description                                             |
| --------- | -------------------------------------------------------- |
| **route** | Route pattern to match, may include `{param}` segments |
| exact?    | Match only when nothing is left over after `route` — no prefix matching, and nothing remains for a nested `<x-route>`. Needed for `route="/"` to mean just the root, since plain `/` otherwise matches every path. |

## Examples

### Linking to a route

Plain `<a href="#/...">` links drive navigation — the route matches whatever the browser's URL hash becomes.

```html drx
<x-app>
    <x-route route="/" exact>
        <x-page-container page="home"></x-page-container>
    </x-route>
    <x-route route="/posts/{id}">
        <x-page-container page="post"></x-page-container>
    </x-route>

    <x-page name="home">
        <h1>Home</h1>
        <a href="#/posts/42">View post 42</a>
    </x-page>

    <x-page name="post">
        <p>Post id: {{router.params.id()}}</p>
        <a href="#/">Home</a>
    </x-page>
</x-app>
```

### Navigating with `router.navigate`

`router.navigate(path)` is callable bare from the template, same as `router.active(path)` — a button's `onclick` navigates imperatively instead of rendering a link.

```html drx
<x-app>
    <x-route route="/" exact>
        <x-page-container page="home"></x-page-container>
    </x-route>
    <x-route route="/posts/{id}">
        <x-page-container page="post"></x-page-container>
    </x-route>

    <x-page name="home">
        <h1>Home</h1>
        <button onclick="router.navigate('/posts/42')">View post 42</button>
    </x-page>

    <x-page name="post">
        <p>Post id: {{router.params.id()}}</p>
    </x-page>
</x-app>
```

### Navigating from a script automatically

A page's own `onMount()` calls `router.navigate(path)` without any user interaction — useful for redirects, such as sending an old path to its replacement.

```html drx
<x-app>
    <x-route route="/old-page" exact>
        <x-page-container page="redirect"></x-page-container>
    </x-route>
    <x-route route="/new-page" exact>
        <x-page-container page="newPage"></x-page-container>
    </x-route>
    <x-route route="/" exact>
        <x-page-container page="home"></x-page-container>
    </x-route>

    <x-page name="home">
        <h1>Home</h1>
        <a href="#/old-page">Go to old link</a>
    </x-page>

    <x-page name="redirect">
        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                onMount() { drx.router.navigate('/new-page'); }
            });
        </script>
        <p>Redirecting…</p>
    </x-page>

    <x-page name="newPage">
        <h1>New page</h1>
    </x-page>
</x-app>
```
