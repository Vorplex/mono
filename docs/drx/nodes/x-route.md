# \<x-route>

Renders its children whenever `route` matches the current URL (partial/prefix by default). A route without a `route` attribute is the fallback: it renders when no other route at the same routing level matches. Paths are matched leniently: `#notes`, `#/notes` and `#/notes/` are the same path, letter case is ignored, and anything after `?` is ignored. Use it for deep-linkable, browser-navigable content instead of a plain variable driving which content shows.

```html
<x-route>
    <!-- Template -->
</x-route>
```

| Attribute | Description                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| route?    | Route pattern to match, may include `{param}`, optional `{param?}` and catch-all `{...param}` parameters — see [Route patterns](#route-patterns). Omit it for the fallback route                                   |
| exact?    | Match only when nothing is left over after `route` — no prefix matching, and nothing remains for a nested `<x-route>`. Needed for `route="/"` to mean just the root, since plain `/` otherwise matches every path. |

## Route patterns

| Pattern                    | Matches                               | `router.params`                                |
| -------------------------- | ------------------------------------- | ---------------------------------------------- |
| `/posts/{id}`              | `/posts/42`                           | `id` is `'42'`                                 |
| `/users/{id}/{tab?}`       | `/users/7` and `/users/7/settings`    | `tab` is `undefined` or `'settings'`           |
| `/docs/{...path}`          | `/docs` and `/docs/guides/routing.md` | `path` is `undefined` or `'guides/routing.md'` |
| `/files/report-{year}.pdf` | `/files/report-2026.pdf`              | `year` is `'2026'`                             |
| `/posts`                   | `/Posts` and `/posts?sort=new`        | none                                           |

```html drx
<x-app>
    <a href="#/users/7">User 7</a> <a href="#/users/7/settings">User 7 settings</a> <a href="#/docs/guides/routing.md">Guide</a> <a href="#/files/report-2026.pdf">Report</a>
    <x-route route="/users/{id}/{tab?}" exact>
        <p>User {{router.params.id()}}, tab {{router.params.tab() ?? 'none'}}</p>
    </x-route>
    <x-route route="/files/report-{year}.pdf" exact>
        <p>Report for {{router.params.year()}}</p>
    </x-route>
    <x-route route="/docs/{...path}">
        <p>Doc {{router.params.path() ?? 'none'}}</p>
    </x-route>
</x-app>
```

## Examples

### Fallback route

A route without a `route` attribute renders whenever no other route at the same routing level matches, e.g. for a "not found" page. The routing level is the app, or the route a route is rendered inside: routes nested in elements, `<x-if>`, `<x-for>` or pages placed at that level all count, and a route that isn't currently rendered (inside a false `<x-if>`) doesn't.

```html drx
<x-app>
    <a href="#/">Home</a> <a href="#/missing">Broken link</a>
    <x-route route="/" exact><h1>Home</h1></x-route>
    <x-route><h1>Page not found</h1></x-route>
</x-app>
```

### Highlighting the active link

`router.active(path)` matches as a prefix, so `/notes` is active on `/notes/42` too. Pass `true` as the second argument for an exact match — `active('/', true)` is only true on the home route.

```html drx
<x-app>
    <style>.active { font-weight: bold; }</style>
    <a href="#/" class.active="router.active('/', true)">Home</a> <a href="#/notes" class.active="router.active('/notes')">Notes</a>
    <x-route route="/" exact><p>Home</p></x-route>
    <x-route route="/notes"><p>Notes</p></x-route>
</x-app>
```

### Relative paths

Inside an `<x-route>`, paths starting with `.` are relative to the part of the URL that route matched: `./edit` inside `/posts/{id}` means `/posts/42/edit`, and `../` goes up a level. They work for both `router.active` and `router.navigate`; paths starting with `/` are always absolute.

```html drx
<x-app>
    <style>.active { font-weight: bold; }</style>
    <a href="#/posts/42">Post 42</a>
    <x-route route="/posts/{id}">
        <p>Post {{router.params.id()}}</p>
        <button class.active="router.active('./', true)" onclick="router.navigate('./')">View</button> <button class.active="router.active('./edit')" onclick="router.navigate('./edit')">Edit</button>
        <x-route route="/edit"><p>Editing post {{router.params.id()}}</p></x-route>
    </x-route>
</x-app>
```

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
