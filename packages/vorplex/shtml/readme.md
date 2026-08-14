# SHTML Reference

SHTML is a declarative markup language for reactive web apps, built from composable nodes (`<x-*>` tags) that compile to a runtime powered by Vorplex.

In attribute tables below: `name` is required, `name?` is optional, `*name` supports `{{ }}` expressions (combined as `*name?`).

## Quick Start

A complete, working app — no imports, no build config:

```html
<x-app>
  <x-page name="home">
    <x-variable name="count">0</x-variable>
    <button onclick="count(count() + 1)">Clicked {{count()}} times</button>
  </x-page>
</x-app>
```

## `<x-app>`

Exactly one per app — the composition root that wraps everything else.

No attributes.

```html
<x-app>
  <x-page name="home">...</x-page>
</x-app>
```

## `<x-import>`

Splices another file's content in at the tag's position — resolved before compilation, so it behaves like a literal paste. The `.shtml` extension may be omitted; `.ts` and `.css` must be given explicitly.

| Name  | Description                   |
| ----- | ----------------------------- |
| `src` | Path to the file to splice in |

```html
<x-app>
  <x-import src="./header"></x-import>
  <!-- header.shtml's markup, spliced here -->
  <x-import src="./script.ts"></x-import>
  <!-- becomes an inline TypeScript script -->
  <x-import src="./style.css"></x-import>
  <!-- becomes an inline stylesheet -->
</x-app>
```

## `<x-router>`

| Node         | Name    | Description                                                                                                                                                                                                                                                                   |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<x-router>` |         | Holds `<x-route>` entries. Once mounted, any rendered page can read the current match reactively — `router.route()` / `router.params.<n>()` in a template, or `shtml.router.route` / `shtml.router.params` (plain reads) and `shtml.router.navigate('/posts')` from a script. |
| `<x-route>`  |         | Declares one path → page mapping inside `<x-router>`                                                                                                                                                                                                                          |
|              | `route` | The path to match, e.g. `/posts/{id}`                                                                                                                                                                                                                                         |
|              | `page?` | The `<x-page>` name to render; defaults to `route`'s last path segment                                                                                                                                                                                                        |

```html
<x-app>
  <x-router>
    <x-route route="/" page="home"></x-route>
    <x-route route="/posts/{id}" page="post"></x-route>
    <!-- page omitted: defaults to the route's last segment, "404" -->
    <x-route route="/404" />
  </x-router>

  <x-page name="post">
    <a href="#/posts" class.active="{{router.route() === '/posts'}}">Posts</a>
    <p>Post id: {{router.params.id()}}</p>
  </x-page>
</x-app>
```

## `<x-page>`

Declares a page, referenced by `<x-route>`, `<x-page-container>`, or `shtml.pages.<name>`.

| Name   | Description           |
| ------ | --------------------- |
| `name` | The page's identifier |

```html
<x-app>
  <x-page name="home">
    <x-variable name="count">0</x-variable>
    <button onclick="count(count() + 1)">Clicked {{count()}} times</button>
  </x-page>
</x-app>
```

## `<x-page-container>`

Embeds another page inline as a layout slot — for a shared header, or to switch a slot reactively. The embedded page shares the same app context as its host — it isn't sandboxed the way a component is.

| Name    | Description                  |
| ------- | ---------------------------- |
| `*page` | The `<x-page>` name to embed |

```html
<x-page name="shell">
  <x-variable name="activeTab">"profile"</x-variable>

  <x-page-container page="header"></x-page-container>
  <x-page-container page="{{activeTab() + '-tab'}}"></x-page-container>
</x-page>
```

## `<x-component>`

| Node                     | Name         | Description                                                                                                                                                                                                                              |
| ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<x-component>`          |              | Declares a fully isolated component — no access to the app, the page, or any enclosing component. Anything it needs from outside — variables, assets, APIs, even nested components — must be declared again locally inside it.           |
|                          | `name`       | The component's identifier                                                                                                                                                                                                               |
| `<x-property>`           |              | Declares a prop: an entry point. Exposed as a callable signal in the template (`level()`); read-only from the component's own script (`shtml.component.props.level()`).                                                                  |
|                          | `name`       | The prop's identifier                                                                                                                                                                                                                    |
|                          | `type?`      | TSON type; defaults to `any`                                                                                                                                                                                                             |
| `<x-event>`              |              | Declares an event: an exit point. Call `shtml.component.events.<name>.emit(value)` from the component's script to fire it.                                                                                                               |
|                          | `name`       | The event's identifier                                                                                                                                                                                                                   |
|                          | `type?`      | TSON type; defaults to `any`                                                                                                                                                                                                             |
| `<x-component-instance>` |              | Instantiates a `<x-component>` by name. One literal attribute per declared prop; one handler attribute per declared event, matching the event's `name` exactly (no prefix) and receiving whatever was passed to `.emit(...)` as `event`. |
|                          | `*component` | The `<x-component>` name to instantiate                                                                                                                                                                                                  |

```html
<x-app>
  <x-component name="alert">
    <x-property name="text" type="string"></x-property>
    <x-property name="level" type="string"></x-property>
    <x-event name="dismissed" type="string"></x-event>

    <script type="application/typescript">
      export default Shtml.defineComponent(shtml => class {
          dismiss() {
              shtml.component.events.dismissed.emit(shtml.component.props.level());
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

## `<x-variable>`

Declares reactive state. Exposed as a callable signal: call with no arguments to read, one argument to write. `profile.name()` subscribes only to that path — prefer it over `profile().name`, which subscribes to the whole object and re-runs on any change to it. Path traversal is null-safe: an unset intermediate value reads as `undefined` instead of throwing.

| Name    | Description                  |
| ------- | ---------------------------- |
| `name`  | The variable's identifier    |
| `type?` | TSON type; defaults to `any` |

```html
<x-page name="profile-page">
  <x-variable name="profile" type="object"
    >{ "name": "Ada", "role": "admin" }</x-variable
  >

  <p>{{profile.name()}}</p>
  <button onclick="profile.name('Grace')">Rename</button>
</x-page>
```

## `<x-type>`

Declares a named, reusable TSON schema, referenced by name from any `type` attribute. See [Types](#types) for the full TSON type system.

| Name   | Description           |
| ------ | --------------------- |
| `name` | The type's identifier |

```html
<x-app>
  <x-type name="priority"
    >{ "type": "enum", "flags": ["low", "medium", "high"] }</x-type
  >
  <x-variable name="taskPriority" type="priority">"medium"</x-variable>
</x-app>
```

## `<x-asset>`

Declares a static asset. `asset.<name>` always resolves to a plain URL string, whether declared inline (`type` required, body is the literal asset content) or external (`src`). It's a static value, not a signal — no `()` call.

| Name    | Description                                    |
| ------- | ---------------------------------------------- |
| `name`  | The asset's identifier                         |
| `src?`  | External URL; omit to declare the asset inline |
| `type?` | MIME type; required if `src` is omitted        |

```html
<x-app>
  <x-asset name="logo" type="image/svg+xml">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
  </x-asset>

  <x-asset name="favicon" src="https://example.com/favicon.ico"></x-asset>

  <x-page name="home">
    <img src="{{asset.logo}}" />
  </x-page>
</x-app>
```

## `<x-icon>`

Mounts as `<svg>`. `name` resolves against a built-in icon set — a name with no match renders nothing. Any extra attribute binds onto the rendered `<svg>` exactly like on an ordinary element.

| Name                      | Description                     |
| ------------------------- | ------------------------------- |
| `*name`                   | The icon to render              |
| `*(any other attribute)?` | Binds onto the rendered `<svg>` |

```html
<x-page name="nav">
  <x-icon
    name="{{expanded() ? 'chevron-up' : 'chevron-down'}}"
    class="nav-icon"
    style.width="20px"
  ></x-icon>
</x-page>
```

## `<x-api>`

| Node            | Name        | Description                                                                                                                                                                                                                                                              |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<x-api>`       |             | Declares an API client, reached at runtime via `shtml.apis.<name>.<endpoint>.request({ parameters, headers, body })`.                                                                                                                                                    |
|                 | `name`      | The API client's identifier                                                                                                                                                                                                                                              |
|                 | `url`       | Base URL prepended to every endpoint's `path`                                                                                                                                                                                                                            |
| `<x-endpoint>`  |             | Declares one request definition inside `<x-api>`.                                                                                                                                                                                                                        |
|                 | `name`      | The endpoint's identifier                                                                                                                                                                                                                                                |
|                 | `path`      | Request path, appended to the API's `url`; may contain `{placeholder}` segments                                                                                                                                                                                          |
|                 | `method?`   | HTTP method; defaults to `GET`                                                                                                                                                                                                                                           |
| `<x-parameter>` |             | Declares a `path`/query parameter for the enclosing `<x-endpoint>`. A missing `required` parameter throws before the request is sent; parameters not consumed by a `{placeholder}` in `path` are appended as query-string params (only on endpoints with no `<x-body>`). |
|                 | `name`      | The parameter's identifier                                                                                                                                                                                                                                               |
|                 | `required?` | Presence flag — throws if omitted at request time                                                                                                                                                                                                                        |
| `<x-header>`    |             | Declares a request header for the enclosing `<x-endpoint>`. A missing `required` header throws before the request is sent.                                                                                                                                               |
|                 | `name`      | The header's identifier                                                                                                                                                                                                                                                  |
|                 | `required?` | Presence flag — throws if omitted at request time                                                                                                                                                                                                                        |
| `<x-body>`      |             | Declares the request body's type for the enclosing `<x-endpoint>`. When declared and `options.body` is provided, `Content-Type: application/json` is set automatically.                                                                                                  |
|                 | `type?`     | TSON type; defaults to `any`                                                                                                                                                                                                                                             |
| `<x-response>`  |             | Declares the response body's type for the enclosing `<x-endpoint>`. `response.value()` returns the parsed, type-validated body (memoized); `response.raw` is the underlying `Response`.                                                                                  |
|                 | `type?`     | TSON type; defaults to `any`                                                                                                                                                                                                                                             |

```html
<x-app>
  <x-type name="todo"
    >{ "type": "object", "properties": { "id": { "type": "number" }, "title": {
    "type": "string" } } }</x-type
  >

  <x-api name="todoApi" url="https://api.example.com">
    <x-endpoint name="list" path="/todos" method="GET">
      <x-response type="array"></x-response>
    </x-endpoint>
    <x-endpoint name="create" path="/todos" method="POST">
      <x-body type="todo"></x-body>
      <x-response type="todo"></x-response>
    </x-endpoint>
    <x-endpoint name="remove" path="/todos/{id}" method="DELETE">
      <x-parameter name="id" required></x-parameter>
      <x-header name="authorization" required></x-header>
    </x-endpoint>
  </x-api>
</x-app>
```

```ts
export default Shtml.definePage(
  (shtml) =>
    class {
      async onMount() {
        const response = await shtml.apis.todoApi.list.request();
        const todos = await response.value(); // parsed against the declared <x-response> type

        await shtml.apis.todoApi.create.request({ body: { title: "Ship it" } });

        await shtml.apis.todoApi.remove.request({
          parameters: { id: 7 }, // fills the {id} path placeholder
          headers: { authorization: "Bearer token" },
        });
      }
    }
);
```

## `<x-service>`

A plain class for behavior that doesn't belong to any one page or component — no template, just a script. Reached at runtime via `shtml.services.<name>.<method>(...)`.

| Name   | Description              |
| ------ | ------------------------ |
| `name` | The service's identifier |

```html
<x-app>
  <x-service name="logger">
    <script type="application/typescript">
      export default Shtml.defineService(shtml => class {
          log(message: string) {
              console.log(message);
          }
      });
    </script>
  </x-service>
</x-app>
```

```ts
export default Shtml.definePage(
  (shtml) =>
    class {
      onMount() {
        shtml.services.logger.log("ready");
      }
    }
);
```

## `<x-packages>`

Declares npm package versions available to a script's bare imports. At most one per app or component; a component's declaration is local to it.

No attributes — body is a JSON object of package name → version.

```html
<x-app>
  <x-packages>{ "lodash": "^4.17.21" }</x-packages>
</x-app>
```

```ts
import { upperCase } from "lodash";

export default Shtml.definePage(
  (shtml) =>
    class {
      onMount() {
        console.log(upperCase("ready"));
      }
    }
);
```

## `<x-if>`

Conditionally renders its children based on `condition`.

| Name         | Description                       |
| ------------ | --------------------------------- |
| `*condition` | Truthy value that gates rendering |

```html
<x-page name="cart">
  <x-variable name="items" type="array"
    >[{ "id": 1, "label": "Coffee" }, { "id": 2, "label": "Tea" }]</x-variable
  >

  <x-if condition="{{items().length === 0}}">
    <p>No items yet.</p>
  </x-if>
</x-page>
```

Don't place `<x-if>` directly inside `<table>`/`<tbody>`/`<tr>` — see [Gotcha: Table Layouts](#gotcha-table-layouts).

## `<x-for>`

Renders its children once per entry in `each`. `as` names the per-entry binding (default `item`); `item.label()` subscribes to just that property. `track` gives each entry a reconciliation identity across re-renders (falls back to array position / object key). Iterating an object instead exposes the key via `key`.

| Name     | Description                                      |
| -------- | ------------------------------------------------ |
| `*each`  | The array or object to iterate                   |
| `as?`    | Per-entry binding name; defaults to `item`       |
| `index?` | Per-entry numeric index binding name             |
| `key?`   | Per-entry key binding name, for object iteration |
| `track?` | Reconciliation identity per entry                |

```html
<x-page name="menu">
  <x-variable name="items" type="array"
    >[{ "id": 1, "label": "Coffee" }, { "id": 2, "label": "Tea" }]</x-variable
  >

  <x-for each="{{items()}}" as="item" index="i" track="id">
    <div>#{{i()}} {{item.label()}}</div>
  </x-for>
</x-page>
```

```html
<x-page name="settings-page">
  <x-variable name="settings" type="object"
    >{ "darkMode": true, "compact": false }</x-variable
  >

  <x-for each="{{settings()}}" as="value" key="setting">
    <div>{{setting()}}: {{value()}}</div>
  </x-for>
</x-page>
```

Don't place `<x-for>` directly inside `<table>`/`<tbody>`/`<tr>` — see [Gotcha: Table Layouts](#gotcha-table-layouts).

## Scripts

Every app/page/component/service script follows the same shape: `export default Shtml.defineApp/definePage/defineComponent/defineService(shtml => class { ... })`. Inline, it needs `<script type="application/typescript">`; imported as a `.ts` file, the same `export default` line stands alone.

In a script, state is read through `shtml`: `shtml.page.variables.<n>.get()/set(value)/reset()/validate()` (same surface for `shtml.app.variables.<n>`). Pages inherit the app: a page script can call `shtml.app.instance.<method>(...)` and read/write `shtml.app.variables.<n>` directly. Without a router, `shtml.pages.<n>.show()` switches which page is displayed.

```html
<x-page name="counter">
  <x-variable name="count">0</x-variable>

  <script type="application/typescript">
    export default Shtml.definePage(shtml => class {
        onMount() {
            console.log('mounted with', shtml.page.variables.count.get());
        }
        reset() {
            shtml.page.variables.count.reset();
        }
    });
  </script>

  <button onclick="count(count() + 1)">{{count()}}</button>
  <button onclick="reset()">Reset</button>
</x-page>
```

## Templating

```html
<x-page name="panel">
  <x-variable name="expanded">false</x-variable>

  <button
    onclick="expanded(!expanded())"
    class.open="{{expanded()}}"
    style.font-weight="{{expanded() ? 'bold' : 'normal'}}"
    title="Toggle ({{expanded() ? 'open' : 'closed'}})"
  >
    Toggle
  </button>
</x-page>
```

`{{ }}` interpolates in text and any element/`<x-icon>` attribute. `class.<n>` toggles a class on/off based on truthiness; `style.<property>` sets one inline style property. An event handler attribute (`onclick`, etc.) is a plain call, not a `{{ }}` expression — it resolves against the enclosing script's methods or a signal, and runs once per event rather than being reactively tracked.

## Types

Every `type` attribute (on `<x-variable>`, `<x-property>`, `<x-event>`, `<x-body>`, `<x-response>`) accepts one of these primitive names, or an `<x-type>` name — this is TSON, SHTML's schema notation:

| Type      | Extra keys               | Example body                                                                 |
| --------- | ------------------------ | ---------------------------------------------------------------------------- |
| `string`  | min, max, match (regex)  | `{ "type": "string", "min": 1, "max": 40 }`                                  |
| `number`  | min, max, integer        | `{ "type": "number", "integer": true, "min": 0 }`                            |
| `boolean` | —                        | `{ "type": "boolean" }`                                                      |
| `object`  | properties               | `{ "type": "object", "properties": { "name": { "type": "string" } } }`       |
| `array`   | itemDefinition, min, max | `{ "type": "array", "itemDefinition": { "type": "string" } }`                |
| `enum`    | flags (required)         | `{ "type": "enum", "flags": ["success", "warning", "error"] }`               |
| `record`  | property                 | `{ "type": "record", "property": { "type": "boolean" } }`                    |
| `union`   | union (array of types)   | `{ "type": "union", "union": [{ "type": "string" }, { "type": "number" }] }` |
| `any`     | —                        | `{ "type": "any" }`                                                          |

`record` describes an object with arbitrary string keys all sharing one value type (e.g. `{ "urgent": true, "reviewed": false }`); `union` requires the value to match one of the listed types. Any type may also carry `description` (string) and `default` (`{ "value": ... }`, marking an object property optional).

A `<x-variable>`'s own body, by contrast, is a plain data literal matching its type — not a schema:

```html
<x-type name="tags"
  >{ "type": "record", "property": { "type": "boolean" } }</x-type
>
<x-variable name="pageTags" type="tags"
  >{ "urgent": true, "reviewed": false }</x-variable
>
```

## Modals

Any `<x-page>` can be opened as a modal:

```html
<x-page name="confirm-delete">
  <script type="application/typescript">
    export default Shtml.definePage(shtml => class {
        confirm() {
            shtml.modal.close({ confirmed: true });
        }
    });
  </script>
  <div class="modal-overlay">
    <div
      class="modal-backdrop"
      onclick="modal.close({ confirmed: false })"
    ></div>
    <section class="modal-card">
      <p>Delete "{{modal.data.name}}"?</p>
      <button onclick="modal.close({ confirmed: false })">Cancel</button>
      <button onclick="confirm()">Delete</button>
    </section>
  </div>
</x-page>
```

```ts
export default Shtml.definePage(
  (shtml) =>
    class {
      async openDeleteConfirm() {
        const result = await shtml.pages["confirm-delete"].showModal({
          data: { name: "Q3 Report" },
        });
        if (result.confirmed) {
          /* ... */
        }
      }
    }
);
```

`options.data` becomes `shtml.modal.data` (script) / `modal.data` (template), available from `onMount()` onward. The framework supplies only a bare, full-screen host — the modal page owns its own backdrop, centering, and sizing.

## Gotcha: Table Layouts

SHTML source is parsed with the browser's own HTML parser, so `<table>`/`<tbody>`/`<tr>`'s restricted content model applies to `<x-if>`/`<x-for>`/`<x-import>` exactly as it would to any other unrecognized element — they get silently relocated out of the row/cell structure they were meant to wrap:

```html
<!-- Breaks: <x-for> is relocated out of <tbody>, severed from the <tr> it wraps -->
<!-- (surfaces as a runtime "row is not defined" error, not a parse error) -->
<x-page name="orders">
  <table>
    <tbody>
      <x-for each="{{rows()}}" as="row" track="id">
        <tr>
          <td>{{row.label()}}</td>
        </tr>
      </x-for>
    </tbody>
  </table>
</x-page>
```

```html
<!-- Works: build the grid with <div> instead -->
<x-page name="orders">
  <div class="table" style="display: grid">
    <x-for each="{{rows()}}" as="row" track="id">
      <div class="table-row">{{row.label()}}</div>
    </x-for>
  </div>
</x-page>
```
