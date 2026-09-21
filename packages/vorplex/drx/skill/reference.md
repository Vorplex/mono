# DRX node reference

In attribute tables: `name` is required, `name?` is optional, `*name` supports `{{ }}` expressions (combined as `*name?`). An expression attribute re-evaluates reactively; a plain one is read once at parse/mount time.

## Contents

- [`<x-app>`](#x-app)
- [`<x-import>`](#x-import)
- [Routing: `<x-route>`](#routing-x-route)
- [`<x-page>`](#x-page)
- [`<x-page-container>`](#x-page-container)
- [`<x-component>` / `<x-property>` / `<x-event>` / `<x-component-instance>`](#x-component--x-property--x-event--x-component-instance)
- [`<x-variable>`](#x-variable)
- [`<x-type>` and TSON types](#x-type-and-tson-types)
- [`<x-asset>`](#x-asset)
- [`<x-icon>`](#x-icon)
- [`<x-api>` / `<x-endpoint>` / `<x-parameter>` / `<x-header>` / `<x-body>` / `<x-response>`](#x-api--x-endpoint--x-parameter--x-header--x-body--x-response)
- [`<x-service>`](#x-service)
- [`<x-packages>`](#x-packages)
- [`<x-if>`](#x-if)
- [`<x-for>`](#x-for)
- [`<x-pwa-metadata>`](#x-pwa-metadata)
- [Modals](#modals)
- [Naming: identifiers vs. plain strings](#naming-identifiers-vs-plain-strings)
- [Plain elements](#plain-elements)

## `<x-app>`

Exactly one per app. The composition root — everything else nests inside it. `<x-app>` can hold template content directly as children (elements, `<x-route>`, `<x-page-container>`), making it the app's entry point/shell, not just a declarations bag.

No attributes.

```html
<x-app>
  <x-page name="home">...</x-page>
</x-app>
```

## `<x-import>`

Splices another file's content in at the tag's position, resolved **before** compilation — treat it as a literal paste, not a lazy-loaded module.

| Name | Description |
| --- | --- |
| `src` | Path to the file to splice in |

`.drx` files splice in as markup; `.ts`/`.css` become an inline `<script type="application/typescript">`/`<style>`.

```html
<x-app>
  <x-import src="./header.drx"></x-import>
  <x-import src="./script.ts"></x-import>
  <x-import src="./style.css"></x-import>
</x-app>
```

## Routing: `<x-route>`

Every app is router-aware; there is **no separate `<x-router>` wrapper element**. `<x-route>` renders its children whenever `route` matches, and can appear directly in `<x-app>`'s template or anywhere inside it (including nested inside another `<x-route>`, or inside a page).

| Name | Description |
| --- | --- |
| `route` | Path to match, e.g. `/posts/{id}` |

Matching is **partial/prefix** by default: `/` matches everything, `/posts` stays matched under `/posts/anything`. Check `router.route() === '/exact/path'` (in an `<x-if>`) when a route must render only at that exact path, not beneath it. Sibling routes match **independently, not exclusively** — several can be active at once (useful for highlighting a nav link off the same path a page route also matches).

Nesting composes both path and params: `<x-route route="/edit/{id}">` nested under `<x-route route="/posts">` means `/posts/edit/{id}` without repeating `/posts`; a nested route's params add to the parent's, and a nested param shadows an outer one of the same name only within its own rendered content.

Templates: `router.route()` / `router.params.<name>()` reactively, `router.active(path)` to check a partial-match (the same nav-highlight helper). Scripts: `drx.router.route` / `drx.router.params` (plain reads), `drx.router.active(path)`, `drx.router.navigate(path)`.

```html
<x-app>
  <x-route route="/">
    <x-page-container page="home"></x-page-container>
  </x-route>
  <x-route route="/posts/{id}">
    <x-page-container page="post"></x-page-container>
  </x-route>

  <x-page name="post">
    <a href="#/posts" class.active="{{router.active('/posts')}}">Posts</a>
    <p>Post id: {{router.params.id()}}</p>
  </x-page>
</x-app>
```

`<x-page>` (like every other declaration — `<x-variable>`, `<x-component>`, `<x-asset>`, ...) is always a **direct child of `<x-app>`**, never a sibling after `</x-app>` closes — the parser only looks for pages inside the app element. Renderable content and declarations happily coexist as children of the same `<x-app>` tag; DRX separates them internally.

## `<x-page>`

Declares a page, targetable by `<x-route>`, `<x-page-container>`, or `drx.pages.<name>.show()`/`.showModal()`.

| Name | Description |
| --- | --- |
| `name` | The page's identifier |

```html
<x-page name="home">
  <x-variable name="count">0</x-variable>
  <button onclick="count(count() + 1)">Clicked {{count()}} times</button>
</x-page>
```

## `<x-page-container>`

Embeds another page inline as a layout slot — for a shared shell, or to switch a slot reactively. Shares the host's **full app context** — not sandboxed like a component instance.

| Name | Description |
| --- | --- |
| `*page` | The `<x-page>` name to embed |

```html
<x-page name="shell">
  <x-variable name="activeTab">"profile"</x-variable>
  <x-page-container page="header"></x-page-container>
  <x-page-container page="{{activeTab() + '-tab'}}"></x-page-container>
</x-page>
```

## `<x-component>` / `<x-property>` / `<x-event>` / `<x-component-instance>`

| Node | Name | Description |
| --- | --- | --- |
| `<x-component>` | | Fully isolated unit — no access to app, page, or any enclosing component. Anything it needs from outside must be redeclared locally inside it. |
| | `name` | The component's identifier |
| `<x-property>` | | A prop: entry point. Exposed as a callable signal in the template (`level()`); read-only in the component's own script (`drx.component.props.level()`). |
| | `name` | The prop's identifier |
| | `type?` | TSON type; defaults to `any` |
| `<x-event>` | | An event: exit point. `drx.component.events.<name>.emit(value)` from the component's script fires it. |
| | `name` | The event's identifier |
| | `type?` | TSON type; defaults to `any` |
| `<x-component-instance>` | | Instantiates a `<x-component>` by name. One literal attribute per declared prop; one handler attribute per declared event, matching the event's `name` exactly (no `on` prefix), receiving whatever was passed to `.emit(...)` as `event`. |
| | `*component` | The `<x-component>` name to instantiate |

`name`/`type` are reserved on props/events; `id`/`component`/`asset` can never be used as a prop or event name (they'd collide with the instance's own attributes).

```html
<x-app>
  <x-component name="alert">
    <x-property name="text" type="string"></x-property>
    <x-property name="level" type="string"></x-property>
    <x-event name="dismissed" type="string"></x-event>

    <script type="application/typescript">
      export default DRX.defineComponent(drx => class {
          dismiss() {
              drx.component.events.dismissed.emit(drx.component.props.level());
          }
      });
    </script>

    <div class="alert" class.critical="{{level() === 'error'}}">
      {{text()}}
      <button onclick="dismiss()">×</button>
    </div>
  </x-component>

  <x-page name="dashboard">
    <x-component-instance
      component="alert"
      text="Disk space low"
      level="error"
      dismissed="onAlertDismissed(event)"
    ></x-component-instance>
  </x-page>
</x-app>
```

A component nested inside another component only sees its **own** declared `<x-component>` children or the app's top-level ones — never an enclosing component's, no matter how deep the nesting. See [gotchas.md](gotchas.md) for why.

## `<x-variable>`

Declares reactive state. Exposed as a callable signal: no arguments reads, one argument writes. `profile.name()` subscribes only to that path — prefer it over `profile().name`, which re-runs on any change anywhere in the object. Path traversal is null-safe.

| Name | Description |
| --- | --- |
| `name` | The variable's identifier |
| `type?` | TSON type; defaults to `any` |

Body is **strict JSON** — see [gotchas.md](gotchas.md).

```html
<x-page name="profile-page">
  <x-variable name="profile" type="object">{ "name": "Ada", "role": "admin" }</x-variable>
  <p>{{profile.name()}}</p>
  <button onclick="profile.name('Grace')">Rename</button>
</x-page>
```

## `<x-type>` and TSON types

`<x-type>` declares a named, reusable TSON schema, referenced by name from any `type` attribute.

| Name | Description |
| --- | --- |
| `name` | The type's identifier |

`type` accepts one of these primitive kinds, or an `<x-type>` name:

| Type | Extra keys | Example body |
| --- | --- | --- |
| `string` | min, max, match (regex) | `{ "type": "string", "min": 1, "max": 40 }` |
| `number` | min, max, integer | `{ "type": "number", "integer": true, "min": 0 }` |
| `boolean` | — | `{ "type": "boolean" }` |
| `object` | properties | `{ "type": "object", "properties": { "name": { "type": "string" } } }` |
| `array` | itemDefinition, min, max | `{ "type": "array", "itemDefinition": { "type": "string" } }` |
| `enum` | flags (required) | `{ "type": "enum", "flags": ["success", "warning", "error"] }` |
| `record` | property | `{ "type": "record", "property": { "type": "boolean" } }` — arbitrary string keys, one value type |
| `union` | union (array of types) | `{ "type": "union", "union": [{ "type": "string" }, { "type": "number" }] }` |
| `any` | — | `{ "type": "any" }` |

Any type may carry `description` (string) and `default` (`{ "value": ... }`, marks an object property optional).

```html
<x-type name="priority">{ "type": "enum", "flags": ["low", "medium", "high"] }</x-type>
<x-variable name="taskPriority" type="priority">"medium"</x-variable>
```

## `<x-asset>`

Declares a static asset. `asset.<name>` resolves to a plain URL string — a static value, not a signal, no `()`.

| Name | Description |
| --- | --- |
| `name` | The asset's identifier |
| `src?` | External URL; omit to declare the asset inline |
| `type?` | MIME type for an inline asset; falls back to `application/octet-stream` |

```html
<x-app>
  <x-asset name="logo" type="image/svg+xml"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg></x-asset>
  <x-asset name="favicon" src="https://example.com/favicon.ico"></x-asset>
  <x-page name="home"><img src="{{asset.logo}}" /></x-page>
</x-app>
```

## `<x-icon>`

Mounts as `<svg>`. `name` resolves against the built-in icon set — no match renders nothing. Extra attributes bind onto the rendered `<svg>` exactly like on any element.

| Name | Description |
| --- | --- |
| `*name` | The icon to render |
| `*(any other attribute)?` | Binds onto the rendered `<svg>` |

```html
<x-icon name="{{expanded() ? 'chevron-up' : 'chevron-down'}}" class="nav-icon" style.width="20px"></x-icon>
```

## `<x-api>` / `<x-endpoint>` / `<x-parameter>` / `<x-header>` / `<x-body>` / `<x-response>`

| Node | Name | Description |
| --- | --- | --- |
| `<x-api>` | | Client, reached via `drx.apis.<name>.<endpoint>.request({ parameters, headers, body })`. |
| | `name` | The client's identifier |
| | `url` | Base URL prepended to every endpoint's `path` |
| `<x-endpoint>` | | One request definition inside `<x-api>`. |
| | `name` | The endpoint's identifier |
| | `path` | Appended to `url`; may contain `{placeholder}` segments |
| | `method?` | HTTP method; defaults to `GET` |
| `<x-parameter>` | | A path/query parameter. A missing `required` parameter throws before the request sends. A parameter not consumed by a `{placeholder}` in `path` becomes a query-string param — only on endpoints with **no** `<x-body>`. |
| | `name` | The parameter's identifier |
| | `required?` | Presence flag |
| `<x-header>` | | A request header. Missing `required` header throws before sending. |
| | `name` | The header's identifier |
| | `required?` | Presence flag |
| `<x-body>` | | Request body's type. When present and `options.body` is supplied, `Content-Type: application/json` is set automatically. |
| | `type?` | TSON type; defaults to `any` |
| `<x-response>` | | Response body's type. `response.value()` returns the parsed, type-validated body (memoized); `response.raw` is the underlying `Response`. |
| | `type?` | TSON type; defaults to `any` |

```html
<x-api name="todoApi" url="https://api.example.com">
  <x-endpoint name="list" path="/todos" method="GET">
    <x-response type="array"></x-response>
  </x-endpoint>
  <x-endpoint name="remove" path="/todos/{id}" method="DELETE">
    <x-parameter name="id" required></x-parameter>
    <x-header name="authorization" required></x-header>
  </x-endpoint>
</x-api>
```

```ts
const response = await drx.apis.todoApi.list.request();
const todos = await response.value();
await drx.apis.todoApi.remove.request({ parameters: { id: 7 }, headers: { authorization: "Bearer token" } });
```

## `<x-service>`

A plain class for behavior not tied to one page or component — no template, just a script. Reached via `drx.services.<name>.<method>(...)`.

| Name | Description |
| --- | --- |
| `name` | The service's identifier |

```html
<x-service name="logger">
  <script type="application/typescript">
    export default DRX.defineService(drx => class {
        log(message: string) { console.log(message); }
    });
  </script>
</x-service>
```

## `<x-packages>`

Declares npm package versions for a script's bare imports. At most one per app/component; a component's is local to it.

No attributes — body is a JSON object of package name → version.

```html
<x-packages>{ "lodash": "^4.17.21" }</x-packages>
```

## `<x-if>`

Conditionally renders children.

| Name | Description |
| --- | --- |
| `*condition` | Truthy value that gates rendering |

Don't nest directly inside `<table>`/`<tbody>`/`<tr>` — see [gotchas.md](gotchas.md).

## `<x-for>`

Renders children once per entry in `each`. `as` names the per-entry binding; `item.label()` subscribes to just that property.

| Name | Description |
| --- | --- |
| `*each` | The array or object to iterate |
| `as` | Per-entry binding name |
| `index?` | Per-entry numeric index binding name |
| `key?` | Per-entry key binding name, for object iteration |
| `track?` | Reconciliation identity per entry (falls back to array position / object key) |

`as`/`index`/`key` must all be distinct, and each must be a valid identifier. Don't nest directly inside `<table>`/`<tbody>`/`<tr>` — see [gotchas.md](gotchas.md).

```html
<x-for each="{{items()}}" as="item" index="i" track="id">
  <div>#{{i()}} {{item.label()}}</div>
</x-for>
```

## `<x-pwa-metadata>`

JSON manifest (camelCase keys, e.g. `shortName`, `themeColor`) for installable/offline support. At most one per app. Only affects exported/deployed output.

## Modals

Any `<x-page>` can be opened as a modal:

```html
<x-page name="confirm-delete">
  <script type="application/typescript">
    export default DRX.definePage(drx => class {
        confirm() { drx.modal.close({ confirmed: true }); }
    });
  </script>
  <div class="modal-overlay">
    <div class="modal-backdrop" onclick="modal.close({ confirmed: false })"></div>
    <section class="modal-card">
      <p>Delete "{{modal.data().name}}"?</p>
      <button onclick="modal.close({ confirmed: false })">Cancel</button>
      <button onclick="confirm()">Delete</button>
    </section>
  </div>
</x-page>
```

```ts
const result = await drx.pages['confirm-delete'].showModal({ data: { name: 'Q3 Report' } });
if (result.confirmed) { /* ... */ }
```

`options.data` becomes `drx.modal.data()` (script) / `modal.data()` (template), a signal (call it) available from `onMount()` onward. `modal.close(result?)` takes the result to resolve the `showModal()` promise with — the argument is optional, call it bare (`modal.close()`) when the caller doesn't need a result (`showModal()` then resolves with `undefined`). The framework supplies only a bare, full-screen host — the modal page owns its own backdrop, centering, and sizing.

`drx.pages.<name>.show()`/`.showModal(...)` is reachable from **both** app scripts and page scripts (a page is never isolated the way a component is, and this holds regardless of whether the page is reached via `<x-page-container>`, `<x-route>`, or `.showModal()` itself — it always shares the full app context) — not only from the app. A component script cannot reach it at all, matching component isolation.

## Naming: identifiers vs. plain strings

`<x-variable name>`, `<x-property name>`, `<x-event name>`, and `<x-for>`'s `as`/`index`/`key` all become bare identifiers in `{{ }}` expression scope, so each must be a valid JS identifier (see [gotchas.md](gotchas.md#reserved-names)). `<x-page name>`, `<x-component name>`, `<x-asset name>`, `<x-api name>`, `<x-type name>`, `<x-service name>` are **not** — they're only ever referenced as plain string values (`page="..."`, `component="..."`, `drx.pages['...']`, `asset.<name>` is the one exception, see below), so hyphens, spaces, or a leading digit are fine, e.g. `<x-page name="contact-modal">`. `asset.<name>` is the one name from this second group that *is* read as a bare identifier (`asset.logo`, not `asset['logo']`) — keep asset names identifier-safe.

## Plain elements

Any ordinary HTML tag (`div`, `button`, `svg`, `input`, ...) works as-is, with `{{ }}` interpolation, `class.<name>`, `style.<property>`, and plain event-handler attributes (`onclick`, etc. — see [gotchas.md](gotchas.md) for the "not `{{ }}`" rule). No `<x-element>` wrapper tag exists or is needed.
