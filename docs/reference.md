<!-- index.md -->

# Vorplex

- [DRX](drx/index.md) — a declarative `<x-*>` markup language that compiles to a reactive runtime with no build step.
- [TSON](core/tson/index.md) — the schema/validation system DRX (and other Vorplex packages) uses to describe and parse typed data.

<!-- drx/index.md -->

# DRX

**DRX** (Declarative Reactive X) is a declarative `<x-*>` markup language that compiles to a reactive runtime with no build step — plain HTML files built from composable nodes like `<x-app>` and `<x-page>`, rendered directly in the browser by a single `<script>` tag.

## Quick Start

`<script src="https://cdn.jsdelivr.net/npm/@vorplex/drx@latest/dist/standalone/drx.js"></script>`

```html drx
<x-app>
  <x-variable name="count">0</x-variable>
  <button onclick="count(value => value + 1)">
    Clicked {{count()}} times
  </button>
</x-app>
```

## Skill

- [DRX skill](skill.md) — the practice guide for AI agents building with DRX.

## Concepts

- [Locals](concepts/locals.md)
- [Expressions](concepts/expressions.md)
- [Templates](concepts/templates.md)
- [Naming](concepts/naming.md)

## Nodes

See [Expressions](concepts/expressions.md) for attribute syntax and expression forms.

- [\\<x-app>](nodes/x-app.md)
- [\<x-library>](nodes/x-libraries.md#libraries)
- [\<x-import>](nodes/x-import.md)
- [\<x-page>](nodes/x-page.md)
- [\<x-page-container>](nodes/x-page-container.md)
- [\<x-component>](nodes/x-component.md)
- [\<x-component-instance>](nodes/x-component-instance.md)
- [\<x-property>](nodes/x-property.md)
- [\<x-event>](nodes/x-event.md)
- [\<x-variable>](nodes/x-variable.md)
- [\<x-type>](nodes/x-type.md)
- [\<x-service>](nodes/x-service.md)
- [\<x-asset>](nodes/x-asset.md)
- [\<x-packages>](nodes/x-packages.md)
- [\<x-libraries>](nodes/x-libraries.md)
- [\<x-dependency-tree>](nodes/x-dependency-tree.md)
- [\<x-pwa-metadata>](nodes/x-pwa-metadata.md)
- [\<x-api>](nodes/x-api.md)
- [\<x-route>](nodes/x-route.md)
- [\<x-if>](nodes/x-if.md)
- [\<x-for>](nodes/x-for.md)
- [\<x-icon>](nodes/x-icon.md)

<!-- drx/skill.md -->

# Working with DRX

This skill is the practice guide. The DRX documentation is the language reference and the source of truth; it wins whenever the two differ. Load it first (step 0) and read the documentation of every DRX feature you use before writing it, rather than relying on remembered syntax.

An app can live in one file or be split across files with `<x-import>`; it is the same DRX either way. Keep the structure you find unless you are asked to change it.

## Workflow

### 0. Load the reference

If the DRX documentation is not already in your context, read it from https://vorplex.github.io/mono/drx/index.md: the concepts and the page for every node you will use, following their links.

### 1. Establish the contract

For a conversion, inspect the entire source app before changing its architecture. Record:

- every screen, overlay, responsive state, and navigation path;
- visible text, CSS, icons, fonts, assets, and native element choices;
- interactions, keyboard behavior, validation, empty/loading/error states, persistence, timers, and downloads;
- data shapes, generators, transformations, API calls, and storage keys.

For a new app, turn the request into the same inventory. Resolve important ambiguity from the available context; ask only when a missing choice would materially change the result.

### 2. Choose ownership

Assign each concern to the narrowest owner whose lifetime matches it:

- App: persistent shell and state that survives page mounts.
- Page: a screen or independently mounted view and its transient presentation state.
- Component: a genuinely reusable, isolated widget with a small property/event surface.
- Service: reusable business rules, transformations, formatting, validation, persistence, or data access.

Prefer an inline template or page over a component when reuse and isolation do not justify the property/event boundary. Prefer app variables and services for coordination; do not couple pages by reaching into another page instance.

### 3. Re-architect declaratively

Translate responsibilities rather than lines:

- mutable UI state becomes owner-scoped variables;
- render functions become templates and bindings;
- conditional and repeated DOM construction becomes DRX template control flow;
- event listeners attached to rendered elements become template handlers;
- business operations and data transformations become service methods;
- owner scripts orchestrate presentation: respond to interaction, call services, update variables, navigate, focus, measure, and manage overlays.

Port algorithms and generators, not their current output. Preserve observable behavior and data semantics even when the implementation shape changes.

### 4. Preserve the product

Unless the request explicitly changes them:

- keep user-visible text, CSS rules, class names, native controls, asset choices, and breakpoints;
- retain loading, error, invalid, empty, disabled, hover, focus, keyboard, and responsive behavior;
- retain persistence keys and the intended lifetime of state across reloads, navigation, and modal reopening;
- relocate styles to the correct owner without casually redesigning them.

### 5. Verify

Verify with what your environment provides: the running app where you can run it, and DRX's validation problems. Finish only when:

- the app starts without errors or DRX problems;
- all screens, routes, overlays, and responsive layouts are reachable;
- primary flows and empty, invalid, loading, and error states work;
- persistence and reset behavior match the contract;
- displayed text and appearance match the source or request;
- every DRX feature you used has been checked against its documentation;
- the architecture standards below hold.

When exact fidelity matters, compare the original and the DRX app at the same viewports and through the same user journeys.

## Architecture standards

Treat **must** rules as review failures. Treat **prefer** rules as defaults that may be overridden for a concrete reason.

### State and updates

- **Must:** Put state that drives rendering in DRX variables owned at the lifetime where it belongs.
- **Must:** Update collections and objects immutably. Use updater functions when the next value depends on the current value.
- **Prefer:** Compute derived values instead of synchronizing duplicate state. Store a derived value only when it has an independent lifecycle or snapshot meaning.
- **Prefer:** Keep lasting state at app scope and ephemeral interaction state at page or component scope.

### Logic and I/O

- **Prefer:** Put business rules, calculations, validation, formatting, persistence, API access, `fetch`, and web storage behind services, keeping owner scripts focused on presentation. Direct I/O from an owner script is fine when it is small and owner-specific.
- **Must:** Keep services independent of owner state and the DOM. Pass values in and return results out.
- **Prefer:** Let an interaction follow `handler -> service -> variable update -> template reaction`.

### Templates and DOM

- **Must:** Use DRX's own features for what they cover (templates, bindings, control flow, routing, state, scoped styles) instead of re-implementing them in script.
- **Prefer:** Keep handlers to a call or a simple write. Move multi-step presentation work into an owner method.
- **Must:** Limit DOM access to work templates cannot perform, such as focus, measurement, scrolling, and third-party widget integration.
- **Must:** Add global listeners and timers during the owner's lifecycle and remove or clear them when that owner unmounts.
- **Must:** Never let untrusted data become markup, styles, or code.
- **Prefer:** Choose names that don't shadow a local or global that a template or handler needs.

### Pages, components, and coordination

- **Prefer:** Use pages for screens and shell regions; use components only for reusable isolated widgets.
- **Must:** Coordinate owners through app state, services, navigation, and component events rather than `window` state or cross-page method calls.

<!-- drx/concepts/locals.md -->

# Locals

A local is any bare identifier a template can reference (`{{ }}`, `onclick`, `class.`/`style.`). A signal local is callable: `name()` reads, `name(value)` or `name(current => next)` writes. A nested path is a signal too, and only the last segment is called: `user.profile.name()`, never `user().profile.name`.

Each level below adds locals on top of what it inherited; lower in the list wins on a name clash.

## App

1. app [`<x-libraries>`](../nodes/x-libraries.md) namespaces
2. `asset`
3. [`router`](../nodes/x-route.md)
4. app script methods
5. app `<x-variable>`s

## Page

Adds on top of App:

6. page script methods
7. page `<x-variable>`s

## Component

Isolated — App/Page locals never apply here. A [nested component](../nodes/x-component.md#nested-components) starts from the locals of the component instance enclosing it, then adds:

1. the app's [`<x-libraries>`](../nodes/x-libraries.md) namespaces
2. `asset` — names it doesn't declare fall back to the enclosing instance's `asset`
3. component script methods
4. component `<x-variable>`s
5. `<x-property>` values
6. `<x-event>`s

## Resets

- `<x-for>` adds `as`/`index`/`key` for its own body only.
- `<x-route>` replaces `router` for its own body only, merging in its matched params.
- `<x-page-container>` restarts from **App**'s locals (not the embedding page's), plus whichever `router` was active.
- A page opened with [`showModal(...)`](../nodes/x-page.md) restarts from **App**'s locals, plus `modal`, before adding its own **Page** locals.
- `<x-component-instance>` starts a fresh **Component** list — nothing from outside carries in, except the enclosing component instance's locals when the component is nested inside another.

<!-- drx/concepts/expressions.md -->

# Expressions

DRX has two forms for using expressions in templates: interpolation and pure expressions. Both evaluate JavaScript against locals available in the current app, page, or component. See [Locals](locals.md) for how those values are exposed.

| Form            | Syntax             | Meaning                                                                                                                                                       |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interpolation   | `Hello {{name()}}` | Mixes literal text with one or more expressions in `{{ }}`. Use it in text content and in attribute values. With no `{{ }}`, the value is plain literal text. |
| Pure expression | `isActive()`       | Evaluates the entire value as one expression, without `{{ }}`. Use it where DRX expects an expression.                                                        |

In text content, interpolation results are shown as text. In a regular attribute, the result is converted to an attribute value: `false`, `null`, and `undefined` remove the attribute; `true` sets it without a value; other values become text. Special attributes such as `class.<name>`, `style.<property>`, and form state attributes apply their own behavior.

## Where each form is used

| Location                                                                      | Form                          | Example                                                                                                                                  |
| ----------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Text content and regular HTML/SVG attributes, including `<x-icon>` attributes | Interpolation                 | `<p title="Greeting for {{name()}}">Hello {{name()}}!</p>`                                                                               |
| `class.<name>` and `style.<property>` attributes                              | Pure expression               | `<div class.open="isOpen()" style.width="width() + 'px'"></div>`                                                                         |
| `<x-if condition>` and `<x-for each>`                                         | Pure expression               | `<x-if condition="isVisible()">...</x-if>`; `<x-for each="items()" as="item">...</x-for>`                                                |
| `<x-page-container page>` and `<x-component-instance component>`              | Interpolation or literal text | `<x-page-container page="{{router.active()}}"></x-page-container>`; `<x-component-instance component="Greeting"></x-component-instance>` |
| Component property attributes on `<x-component-instance>`                     | Interpolation or literal text | `<x-component-instance component="Greeting" name="{{user.name()}}"></x-component-instance>`                                              |
| `<style>` in an app, page or component                                        | Interpolation                 | `<style>:root { --accent: {{accent()}}; }</style>`                                                                                       |

Event handler attributes such as `onclick` and `<x-event>` handlers contain JavaScript statements, which can include expressions. They are a separate handler syntax: `event` is the event, `this` is the element for DOM events, and returning `false` prevents the browser's default action. See [Templates: Event handlers](templates.md#event-handlers) and [Component events](../nodes/x-event.md).

## Example

```html drx
<x-app>
    <style>
        .active {
            border-color: {{backgroundColor()}};
        }
    </style>
    <x-variable name="backgroundColor" type="string">"dodgerblue"</x-variable>
    <x-variable name="name" type="string">"Ada"</x-variable>
    <x-variable name="active" type="boolean">false</x-variable>
    <p title="Greeting for {{name()}}">Hello {{name()}}!</p>
    <button class.active="active()" onclick="active(value => !value)">
        Toggle active
    </button>
</x-app>
```

## Reactivity

An expression updates when a signal it read changes. A script reading a variable with `drx.<owner>.variables.<name>.get()` is not tracked, so an expression that calls a script method reading state that way won't update. Pass the signal's value in as an argument instead.

```html drx
<x-app>
    <x-variable name="count" type="number">0</x-variable>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            label(count) { return count === 1 ? '1 click' : `${count} clicks`; }
        });
    </script>
    <button onclick="count(value => value + 1)">{{label(count())}}</button>
</x-app>
```

<!-- drx/concepts/templates.md -->

# Templates

A template is the markup DRX renders within an app, page, or component. It combines HTML and SVG elements, text, and DRX nodes. [Expressions](expressions.md) connect that markup to locals and update it when their values change.

## Attributes

An attribute containing `{{ }}` is set from its value. `false`, `null` and `undefined` remove the attribute, `true` sets it without a value, anything else is converted to text.

```html drx
<x-app>
    <x-variable name="busy" type="boolean">false</x-variable>
    <button disabled="{{busy()}}" aria-busy="{{String(busy())}}" onclick="busy(true)">Save</button>
</x-app>
```

Use `{{'false'}}` or `{{String(value)}}` for attributes such as `aria-expanded` that need the text `false`.

## Form controls

`value`, `checked`, `selected` and `indeterminate` update the control's current state, not just its initial attribute, so changing the variable always changes what the control shows — including after the user has edited it.

```html drx
<x-app>
    <x-variable name="query" type="string">""</x-variable>
    <x-variable name="size" type="string">"m"</x-variable>
    <input value="{{query()}}" oninput="query(event.target.value)" placeholder="Search">
    <button onclick="query('')">Clear</button>
    <select value="{{size()}}" onchange="size(event.target.value)">
        <option value="s">Small</option>
        <option value="m">Medium</option>
        <option value="l">Large</option>
    </select>
    <p>{{query()}} / {{size()}}</p>
</x-app>
```

## Classes and styles

`class.<name>` toggles a class and `style.<property>` sets one style property. Their value is an expression, without `{{ }}`. Style property names are written in kebab-case. A `class` attribute can also be interpolated; it only adds and removes the classes it produced, so it combines with `class.<name>` on the same element.

```html drx
<x-app>
    <x-variable name="progress" type="number">40</x-variable>
    <style>
        .bar { height: 8px; background: teal; }
        .done { background: green; }
        .tall { height: 16px; }
    </style>
    <div class="bar {{progress() > 50 ? 'tall' : ''}}" class.done="progress() >= 100" style.width="progress() + '%'"></div>
    <button onclick="progress(value => Math.min(100, value + 20))">Advance</button>
</x-app>
```

## HTML content

Text in `{{ }}` is always shown as text. The `html` attribute renders an HTML string instead, replacing the element's own children.

`html` is an escape hatch, not a way to build UI. Anything you can write as markup, including content that changes with state, belongs in the template with `{{ }}`, `<x-if>` and `<x-for>`. Use `html` only for HTML that only exists as a string, such as rendered markdown or content from an API, and escape or sanitize anything that came from a user.

```html drx
<x-app>
    <x-variable name="text" type="string">"Supports **bold** and *italic*"</x-variable>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            markdown(text: string) {
                return text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>');
            }
        });
    </script>
    <textarea oninput="text(event.target.value)">{{text()}}</textarea>
    <div html="{{markdown(text())}}"></div>
</x-app>
```

## Event handlers

`on<event>` attributes run like inline HTML handlers: `event` is the event, `this` is the element, and returning `false` prevents the default action.

```html drx
<x-app>
    <x-variable name="clicks" type="number">0</x-variable>
    <a href="#/elsewhere" onclick="clicks(value => value + 1); return false">Stay here ({{clicks()}})</a>
</x-app>
```

## Tables

The browser's HTML parser only allows table elements inside `<table>`, `<thead>`, `<tbody>` and `<tr>`, so it moves `<x-for>`, `<x-if>` and `<x-component-instance>` out of them before DRX runs. Build dynamic tables from elements with table display or CSS grid instead; `role` attributes keep them accessible.

```html drx
<x-app>
    <x-variable name="rows" type="array">[{ "id": 1, "name": "Ada", "role": "Engineer" }, { "id": 2, "name": "Grace", "role": "Admiral" }]</x-variable>
    <style>
        .table { display: table; border-collapse: collapse; }
        .tr { display: table-row; }
        .td, .th { display: table-cell; padding: 6px 12px; border-bottom: 1px solid #ddd; }
        .th { font-weight: 600; }
    </style>
    <div class="table" role="table">
        <div class="tr" role="row"><span class="th" role="columnheader">Name</span><span class="th" role="columnheader">Role</span></div>
        <x-for each="rows()" as="row" track="id">
            <div class="tr" role="row"><span class="td" role="cell">{{row.name()}}</span><span class="td" role="cell">{{row.role()}}</span></div>
        </x-for>
    </div>
</x-app>
```

## SVG

Inline SVG works like any other markup, including `<x-for>` and `<x-if>` inside it.

```html drx
<x-app>
    <x-variable name="values" type="array">[20, 45, 30, 60]</x-variable>
    <svg width="200" height="80" viewBox="0 0 200 80">
        <x-for each="values()" as="value" index="i">
            <rect x="{{i() * 50}}" y="{{80 - value()}}" width="40" height="{{value()}}" fill="teal"></rect>
        </x-for>
    </svg>
</x-app>
```

## Whitespace

Spaces on the same line are kept; line breaks and the indentation around them are not. Put elements that need a space between them on one line, or space them with CSS such as `gap`.

```html drx
<x-app>
    <p><b>1</b> of <b>10</b></p>
    <p><a href="#/">Home</a> <a href="#/about">About</a></p>
    <p>
        <a href="#/">Home</a>
        <a href="#/about">Joined</a>
    </p>
</x-app>
```

## Failing expressions

If an expression throws while a node is being rendered, the error is logged and that node is not rendered; the rest of the page renders normally. The log names the node's path within its owner, e.g. `Failed to render node at path "/ul[1]/li" in page "orders".`

```html drx
<x-app>
    <p>Before</p>
    <p>{{missing()}}</p>
    <p>After</p>
</x-app>
```

<!-- drx/concepts/naming.md -->

# Naming

Every `name` you declare is camelCase: a lowercase letter followed by letters and digits, such as `userCard`, `todoApi` or `priority`. Names are referenced from expressions and from namespaces like `ui.userCard`, so a `-`, `.`, space or leading capital would break them.

| Applies to                                                                                                                                  |                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `<x-page>`, `<x-component>`, `<x-variable>`, `<x-type>`, `<x-service>`, `<x-asset>`, `<x-api>`, `<x-endpoint>`, `<x-property>`, `<x-event>` | Yes                                                               |
| `<x-library>` names                                                                                                                         | Yes                                                               |
| `<x-parameter>` and `<x-header>` names                                                                                                      | No -- they are sent over the wire as written, e.g. `Content-Type` |
| `<x-icon>` names                                                                                                                            | No -- they name a built-in icon, e.g. `chevron-down`              |

## Files

When an app is split into files, each declaration's file or folder is named after it in kebab-case: the `userCard` component is written to `components/user-card/component.html`, and the `todoApi` api to `apis/todo-api/api.html`.

<!-- drx/nodes/x-app.md -->

# \<x-app>

The composition root of a DRX document — exactly one per file, everything else declares or renders inside it. Use it to hold app-wide declarations (variables, services, types, apis) and any persistent shell UI (nav, layout) that should mount once regardless of which page is active.

```html
<x-app>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { }
            onUnmount() { }
        });
    </script>
    <style></style>
    <x-packages></x-packages>
    <x-libraries></x-libraries>
    <x-dependency-tree></x-dependency-tree>
    <x-pwa-metadata></x-pwa-metadata>
    <x-type></x-type>
    <x-variable></x-variable>
    <x-service></x-service>
    <x-asset></x-asset>
    <x-api></x-api>
    <x-component></x-component>
    <x-page></x-page>

    <!-- Template -->
</x-app>
```

| Attribute | Description     |
| --------- | --------------- |
| name?     | Name of the app |

## Example
```html drx
<x-app name="dashboardApp">
    <h1>Home</h1>
</x-app>
```

## Shadow DOM

The app renders its markup into its own open shadow root, and every page and component inside it renders into a shadow root of its own. Each shadow root is a boundary:

- **CSS rules don't cross it.** That's why each `<style>` only styles its owner's markup. Inherited values — custom properties, `font`, `color` — do cross it.
- **`document.querySelector` doesn't see inside it.** Reach the app's elements through its shadow root: `document.querySelector('x-app').shadowRoot`.
- **Events are retargeted.** A listener on `document` sees the host element as `event.target`; use `event.composedPath()` to find the element that was actually clicked.
- **Ids are scoped.** An id only has to be unique within one shadow root; look it up on that root.

```html drx
<x-app>
    <x-variable name="clicked" type="string">"nothing yet"</x-variable>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() {
                document.addEventListener('click', event => {
                    const target = event.composedPath()[0] as HTMLElement;
                    drx.app.variables.clicked.set(`${target.tagName.toLowerCase()} (event.target was ${(event.target as HTMLElement).tagName.toLowerCase()})`);
                });
            }
        });
    </script>

    <button>Click me</button>
    <p>Last clicked: {{clicked()}}</p>
</x-app>
```

## Styling

Styles live next to what consumes them. The app owns the document, so the app's `<style>` is the place for document-wide concerns: design tokens on `:root`, margins and background on `html`/`body`, fonts and the modal backdrop. Don't add styles to the document `<head>`.

| The app's `<style>` applies to | |
| --- | --- |
| The document (`:root`, `html`, `body`, `::backdrop`) | Yes |
| The app's own markup | Yes |
| Every page, including pages opened as modals | Yes |
| Components | No — they only inherit values such as custom properties, `font` and `color` |

- Rules only match markup in the template they're written for plus its pages: `.layout > .sidebar` in the app style doesn't match a `.sidebar` inside a page, because the page's markup belongs to the page. Style an element from the owner whose template contains it, or with a shared class.
- A page's own rules win over the app's at equal specificity.
- `@keyframes` in the app style work in the app and its pages; a component declares its own.
- `@font-face` and `@property` work in any `<style>`.
- `{{ }}` works in a `<style>` with the owner's locals, and the styles update when those change: `:root { --accent: {{accent()}}; }`, or `src: url({{asset.inter}})` for a font bundled as an [`<x-asset>`](x-asset.md). Per-element values belong in `style.<property>` bindings.
- CSS that a library injects into the document `<head>` applies everywhere, as on any web page; your own styles win over it at equal specificity.
- Pages and components are rendered as `display: contents`, so their top-level elements take part directly in the app's layout, e.g. as grid items.

```html drx
<x-app>
    <x-variable name="accent" type="string">"#0f766e"</x-variable>
    <style>
        :root { --accent: {{accent()}}; --radius: 8px; }
        body { margin: 0; padding: 16px; background: #f7f5f0; font-family: system-ui, sans-serif; }
        .card { background: white; border-radius: var(--radius); padding: 12px; margin-bottom: 8px; }
    </style>

    <x-page name="summary">
        <div class="card">A page uses the app's .card class</div>
    </x-page>

    <x-component name="badge">
        <style>.badge { color: var(--accent); font-weight: 600; }</style>
        <span class="badge">A component inherits the --accent token, not the .card class</span>
    </x-component>

    <x-page-container page="summary"></x-page-container>
    <x-component-instance component="badge"></x-component-instance>
    <button onclick="accent(value => value === '#0f766e' ? '#b45309' : '#0f766e')">Switch accent</button>
</x-app>
```

## Scripting

`<x-app>`'s script is instantiated once, when the app mounts. A syntax error in any script stops the app from starting; the error names the script and line, e.g. `script://pages/orders.ts:3:18`.

```ts
export default DRX.defineApp(drx => class {
    onMount() { }
    onUnmount() { }
});
```

### Lifecycle

| Hook          | Called                                           |
| ------------- | ------------------------------------------------ |
| `onMount()`   | Once, right after the app's template has mounted |
| `onUnmount()` | When the app unmounts                            |

### The `drx` parameter

```ts
interface Drx {
    app: {
        /** This app's own <x-variable> declarations, keyed by name. */
        variables: Record<string, {
            /** Reads the current value. */
            get(): any;
            /** Writes a new value, or an updater function that receives the current value and returns the next one. */
            set(update: any | ((value: any) => any)): void;
            /** Resets the variable back to its declared initial value. */
            reset(): void;
            /** Validates the current value against the variable's declared type; each error carries a message and a path. */
            validate(): [value: any | undefined, errors: { message: string; path: string }[]];
            /** Calls back with the current value immediately and on every change; returns an unsubscribe function. Subscriptions end automatically when the owner unmounts. */
            subscribe(callback: (value: any) => void): () => void;
        }>;
    };

    /** Every <x-api> declared on this app, keyed by name. */
    apis: Record<string, {
        /** The api's base url. */
        url: string;
        endpoints: Record<string, {
            request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
                raw: Response;
                value(): Promise<any>;
            }>;
        }>;
    }>;

    /** Every <x-service> declared on this app, keyed by name; each value is that service's own instance. */
    services: Record<string, Record<string, (...args: any[]) => any>>;

    /** Every library declared on this app, keyed by the library's name. Each is the library's single shared instance. */
    libraries: Record<string, {
        /** The library's top-level <x-variable> declarations, keyed by name -- same shape as drx.app.variables. */
        variables: Record<string, any>;
        /** The library's top-level <x-service> instances, keyed by name. */
        services: Record<string, Record<string, (...args: any[]) => any>>;
        /** The library's top-level <x-api> declarations, keyed by name -- same shape as drx.apis. */
        apis: Record<string, any>;
    }>;

    router: {
        readonly route: string;
        /** Always {} for the app -- pages mounted under an <x-route> receive its params. */
        readonly params: Record<string, string>;
        /** Prefix match by default, exact when `exact` is true. Paths starting with . are relative to the enclosing route. */
        active(path: string, exact?: boolean): boolean;
        /** Paths starting with . are relative to the enclosing route. */
        navigate(path: string): void;
    };

    /** Every <x-page> declared on this app, keyed by name. */
    pages: Record<string, {
        showModal(options?: { data?: any }): Promise<any>;
    }>;
}
```

### Calling script methods from the template

App script methods are callable bare from the app's own template, and from every page's template too (pages share the app's ambient context), without going through `drx.app.instance`:

```html drx
<x-app>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            greet() { console.log('Hello from the app'); }
        });
    </script>

    <button onclick="greet()">Greet</button>
</x-app>
```

<!-- drx/nodes/x-libraries.md -->

# \<x-libraries>

Declares the DRX libraries an app or library uses. Use it to share components, types, variables, services, apis and assets across apps from a single source instead of copying them. Only the top level declares libraries, at most one `<x-libraries>`; every page and component uses them.

```html
<x-libraries></x-libraries>
```

No attributes, content is a JSON array of absolute library URLs.

The playgrounds on this page serve their extra files at `https://drx.playground/`, so the `ui/index.html` tab is the library at `https://drx.playground/ui/`.

## Example
```html drx
<x-app>
    <x-libraries>["https://drx.playground/ui/"]</x-libraries>

    <x-variable name="tone" type="ui.tone">"info"</x-variable>

    <x-component-instance component="ui.badge" label="Badge from the library" tone="{{tone()}}"></x-component-instance>
    <x-component-instance component="ui.card" title="Card from the library"></x-component-instance>
    <p>
        <button onclick="ui.clicks(value => value + 1)">Click</button>
        <button onclick="tone(value => value === 'info' ? 'danger' : 'info')">Switch tone</button>
        {{ui.clicks()}} clicks, shared with every consumer of the library
    </p>
</x-app>
```

```html drx file=ui/index.html
<x-library name="ui">
    <x-type name="tone">{ "type": "enum", "flags": ["info", "success", "danger"] }</x-type>
    <x-variable name="clicks" type="number">0</x-variable>

    <x-component name="badge">
        <x-property name="label" type="string"></x-property>
        <x-property name="tone" type="string"></x-property>
        <style>
            .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; }
            .info { background: #dbeafe; color: #1e40af; }
            .success { background: #dcfce7; color: #166534; }
            .danger { background: #fee2e2; color: #991b1b; }
        </style>
        <span class="badge {{tone() ?? 'info'}}">{{label()}}</span>
    </x-component>

    <x-component name="card">
        <x-property name="title" type="string"></x-property>
        <style>.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; margin: 8px 0; }</style>
        <div class="card">
            <strong>{{title()}}</strong>
            <x-component-instance component="badge" label="The library's own badge" tone="success"></x-component-instance>
        </div>
    </x-component>
</x-library>
```

## Libraries

A library is a `<x-library>` instead of an `<x-app>`. It declares types, variables, services, apis, assets, components, packages and its own libraries, but no template, pages, script or PWA metadata. Its `name` is required, [camelCase](../concepts/naming.md), and is the name every consumer uses it by.

```html
<x-library name="ui"></x-library>
```

| A consumer can use | From the library's top level                                              |
| ------------------ | ------------------------------------------------------------------------- |
| Components         | `<x-component-instance component="ui.button">`                            |
| Types              | `type="ui.priority"`, or `{ "type": "ref", "id": "ui.priority" }` in TSON |
| Variables          | `ui.theme()` in templates, `drx.libraries.ui.variables.theme` in scripts  |
| Services           | `drx.libraries.ui.services.logger.log(...)`                               |
| Apis               | `drx.libraries.ui.apis.todoApi.endpoints.list.request()`                  |
| Assets             | `ui.asset.logo`                                                           |

- **Only the top level is exported.** Components, types and the rest declared inside a library component stay private to that component.
- **One instance.** A library's variables and services exist once per running app, however many pages, components and other libraries use it. `ui.theme()` is the same signal everywhere.
- **A library resolves inside itself.** Inside a library, `component="button"` gets the library's own `button`, never one declared by the consumer, and `icons.star` uses the library's own `<x-libraries>`, never the consumer's.
- **Plain names never reach a library.** `component="button"` only finds the consumer's own components; a library member always needs the library name.
- **Library names are unique.** Every library loaded into an app, directly or through another library, needs a different name. A second library with a name that's already loaded is reported and never loaded.

## Scope

A library declared on the app is usable everywhere in it: the app's template and script, every page, every component however deeply nested, and every service. Declare it once; components never declare their own.

```html drx
<x-app>
    <x-libraries>["https://drx.playground/ui/"]</x-libraries>

    <x-component name="card">
        <x-component name="title">
            <x-component-instance component="ui.badge" label="Nested inside card, using the app's library"></x-component-instance>
        </x-component>
        <x-component-instance component="title"></x-component-instance>
    </x-component>

    <x-component-instance component="card"></x-component-instance>
</x-app>
```

```html drx file=ui/index.html
<x-library name="ui">
    <x-component name="badge">
        <x-property name="label" type="string"></x-property>
        <span style="padding: 2px 10px; border-radius: 999px; background: #dbeafe;">{{label()}}</span>
    </x-component>
</x-library>
```

## URLs

- **A URL must be absolute**, such as `https://cdn.jsdelivr.net/npm/@acme/ui@1.2.0/`. A relative URL is reported and never loaded, so a library means the same thing wherever it's declared and wherever the app is split into files.
- **A URL is a folder or an `.html` file.** A folder loads its `index.html`.
- **A query string carries over** to the library's own imports and relative assets on the same host, so `?ref=main` or an access token reaches every file of the library.
- **The URL is the version.** `@1.2.0`, a git tag or a commit in the URL pins it; `@latest`, a branch or a local folder follows the latest. DRX never interprets versions.
- **Each URL loads once.** Two owners pointing at the same URL share it.
- **Relative asset URLs resolve against the library file that declares them**, so a library can ship its own files. See [`<x-asset>`](x-asset.md).

## Scripting

Scripts reach a library's variables, services and apis through `drx.libraries.<name>`, available to the app, its pages, components and services. A library's own top-level services reach the library's variables through `drx.library`, where an app's services use `drx.app`.

```html drx
<x-app>
    <x-libraries>["https://drx.playground/ui/"]</x-libraries>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() {
                drx.libraries.ui.variables.greeting.set('Hello from the app');
                console.log(drx.libraries.ui.services.formatter.shout());
            }
        });
    </script>
    <p>{{ui.greeting()}}</p>
</x-app>
```

```html drx file=ui/index.html
<x-library name="ui">
    <x-variable name="greeting" type="string">"Hello"</x-variable>
    <x-service name="formatter">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                shout() { return drx.library.variables.greeting.get().toUpperCase() + '!'; }
            });
        </script>
    </x-service>
</x-library>
```

## Names

A library's name must not clash with an app variable. `asset`, `router` and `modal` are reserved.

<!-- drx/nodes/x-import.md -->

# \<x-import>

Splices another file's content in at the tag's position, resolved before compilation — treat it as a literal paste, not a lazy-loaded module. Use it to split a large app across multiple files (a shared header, a script, a stylesheet) instead of inlining everything into one `.drx` document.

```html
<x-import></x-import>
```

| Attribute | Description                |
| --------- | -------------------------- |
| **src**   | Path to the file to splice in |

A `.drx` file splices in as markup; a `.ts` file becomes an inline `<script type="application/typescript">`; a `.css` file becomes an inline `<style>`.

## Example
```html drx
<x-app>
    <x-import src="./header.drx"></x-import>
    <x-import src="./app.ts"></x-import>
    <x-import src="./app.css"></x-import>

    <h1>Home</h1>
</x-app>
```

```html drx file=header.drx
<header>Shared header from header.drx</header>
```

```ts drx file=app.ts
export default DRX.defineApp(drx => class {
    onMount() { console.log('app.ts is the app script'); }
});
```

```css drx file=app.css
header { padding: 8px; background: #f1f5f9; }
h1 { color: #0f766e; }
```

<!-- drx/nodes/x-page.md -->

# \<x-page>

A distinct screen, reachable via `<x-route>`, embedded via `<x-page-container>`, or opened as a modal with `drx.pages.<name>.showModal(...)`. Use it for anything that's a targetable destination in its own right, as opposed to a reusable, isolated unit (that's what `<x-component>` is for).

```html
<x-page>
    <script type="application/typescript">
        export default DRX.definePage(drx => class {
            onMount() { }
            onUnmount() { }
        });
    </script>
    <style></style>
    <x-variable></x-variable>

    <!-- Template -->
</x-page>
```

| Attribute | Description      |
| --------- | ---------------- |
| **name**  | Name of the page |

## Example
```html drx
<x-app>
    <x-page name="home">
        <x-variable name="count" type="number">0</x-variable>
        <button onclick="count(value => value + 1)">Clicked {{count()}} times</button>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```

## Shadow DOM

A page renders its markup into its own open shadow root, inside the app's. That boundary is what keeps page styles from reaching other pages, and it shapes how a page script finds its elements:

- **CSS rules don't cross it**; inherited values (custom properties, `font`, `color`) do.
- **Query the page's own markup through `drx.page.root`**, not `document` — `document.querySelector` can't see inside the page.
- **Ids are scoped to the page**, so `drx.page.root.getElementById(...)` finds them even if another page uses the same id.
- **Events from inside the page are retargeted** at document level; use `event.composedPath()` there.

```html drx
<x-app>
    <x-page name="panel">
        <x-variable name="width" type="number">0</x-variable>
        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                measure() { drx.page.variables.width.set(Math.round(drx.page.root.getElementById('box').getBoundingClientRect().width)); }
            });
        </script>
        <div id="box" style="width: 60%; padding: 8px; background: #e0f2f1">Resize the window, then measure</div>
        <p><button onclick="measure()">Measure</button> {{width()}}px</p>
    </x-page>

    <x-page-container page="panel"></x-page-container>
</x-app>
```

## Styling

A page's `<style>` applies only to that page's own markup, so the same class name can mean different things on different pages. A page also receives the app's style and inherits the app's tokens and fonts.

| Reaches a page's markup | |
| --- | --- |
| The app's `<style>` | Yes |
| The page's own `<style>` | Yes — wins over the app's rules at equal specificity |
| Other pages' styles, including pages it embeds | No |
| CSS a library injects into the document `<head>` | Yes |

- A page's rules don't reach components placed on it or pages embedded in it with `<x-page-container>`.
- `:root`, `html` and `body` belong to the app; in a page's style they match nothing.
- `@font-face` and `@property` work in a page's style.
- `{{ }}` works in a page's style with the page's locals: `.title { font-size: {{size()}}px; }`.
- A page is rendered as `display: contents`, so its top-level elements take part directly in the layout of wherever the page is placed. Position the page with a class on its own root element.

```html drx
<x-app>
    <style>.title { font-family: Georgia, serif; }</style>

    <x-page name="first">
        <style>.title { color: #0f766e; }</style>
        <h2 class="title">First page title</h2>
    </x-page>

    <x-page name="second">
        <style>.title { color: #b45309; }</style>
        <h2 class="title">Second page title</h2>
    </x-page>

    <x-page-container page="first"></x-page-container>
    <x-page-container page="second"></x-page-container>
</x-app>
```

## Scripting

`<x-page>`'s script is instantiated fresh each time that page mounts — every time it's routed to, embedded via `<x-page-container>`, or opened with `.showModal(...)`.

```ts
export default DRX.definePage(drx => class {
    onMount() { }
    onUnmount() { }
});
```

### Lifecycle

| Hook          | Called                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `onMount()`   | Once, right after this page instance's own template has mounted                                                   |
| `onUnmount()` | When this instance of the page unmounts (e.g. a `<x-page-container>`'s `page` changes, or a route stops matching) |

### The `drx` parameter

```ts
interface Drx {
    app: {
        /** The app's own <x-variable> declarations, keyed by name. */
        variables: Record<string, {
            /** Reads the current value. */
            get(): any;
            /** Writes a new value, or an updater function that receives the current value and returns the next one. */
            set(update: any | ((value: any) => any)): void;
            /** Resets the variable back to its declared initial value. */
            reset(): void;
            /** Validates the current value against the variable's declared type; each error carries a message and a path. */
            validate(): [value: any | undefined, errors: { message: string; path: string }[]];
            /** Calls back with the current value immediately and on every change; returns an unsubscribe function. Subscriptions end automatically when the owner unmounts. */
            subscribe(callback: (value: any) => void): () => void;
        }>;
        /** The app script's own class instance -- call its methods directly. */
        instance: any;
    };

    page: {
        /** This page's own <x-variable> declarations, keyed by name. */
        variables: Record<string, {
            /** Reads the current value. */
            get(): any;
            /** Writes a new value, or an updater function that receives the current value and returns the next one. */
            set(update: any | ((value: any) => any)): void;
            /** Resets the variable back to its declared initial value. */
            reset(): void;
            /** Validates the current value against the variable's declared type; each error carries a message and a path. */
            validate(): [value: any | undefined, errors: { message: string; path: string }[]];
            /** Calls back with the current value immediately and on every change; returns an unsubscribe function. Subscriptions end automatically when the owner unmounts. */
            subscribe(callback: (value: any) => void): () => void;
        }>;
        /** This page's shadow root. */
        root: ShadowRoot;
    };

    /** Every <x-api> declared on the app, keyed by name. */
    apis: Record<string, {
        /** The api's base url. */
        url: string;
        endpoints: Record<string, {
            request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
                raw: Response;
                value(): Promise<any>;
            }>;
        }>;
    }>;

    /** Every <x-service> declared on the app, keyed by name; each value is that service's own instance. */
    services: Record<string, Record<string, (...args: any[]) => any>>;

    /** Every library declared on the app, keyed by the library's name. Each is the library's single shared instance. */
    libraries: Record<string, {
        /** The library's top-level <x-variable> declarations, keyed by name -- same shape as drx.app.variables. */
        variables: Record<string, any>;
        /** The library's top-level <x-service> instances, keyed by name. */
        services: Record<string, Record<string, (...args: any[]) => any>>;
        /** The library's top-level <x-api> declarations, keyed by name -- same shape as drx.apis. */
        apis: Record<string, any>;
    }>;

    router: {
        readonly route: string;
        /** Params of the <x-route> this page is mounted under. */
        readonly params: Record<string, string>;
        /** Prefix match by default, exact when `exact` is true. Paths starting with . are relative to the enclosing route. */
        active(path: string, exact?: boolean): boolean;
        /** Paths starting with . are relative to the enclosing route. */
        navigate(path: string): void;
    };

    /** Every <x-page> declared on the app, keyed by name. */
    pages: Record<string, {
        showModal(options?: { data?: any }): Promise<any>;
    }>;

    /** Only present when this page instance was opened via `.showModal(...)`. Calling it otherwise throws. */
    modal?: {
        data(): any;
        close(result?: any): void;
    };
}
```

### Examples

### Calling script methods from the template

Any method on the page's own class is callable bare from that page's own template — in `{{ }}` expressions and in plain attributes like `onclick`. The app's own script methods are reachable the same way too, since a page shares the app's ambient context (unlike a fully isolated component) — a page's own method of the same name takes priority.

A button's `onclick` calls a method declared directly on the page's own script:

```html drx
<x-app>
    <x-page name="home">
        <x-variable name="count" type="number">0</x-variable>

        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                increment() { drx.page.variables.count.set(value => value + 1); }
            });
        </script>

        <button onclick="increment()">Clicked {{count()}} times</button>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```

#### A page script calling an app instance function

Reaches the app script's instance via `drx.app.instance` to call a method declared on the app, not the page.

```html drx
<x-app>
    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            trackVisit(pageName) { console.log(`Visited ${pageName}`); }
        });
    </script>

    <x-page name="home">
        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                onMount() { drx.app.instance.trackVisit('home'); }
            });
        </script>
        <h1>Home</h1>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```

#### A modal page

Opens a page as a modal with `showModal({ data })`, reads the data it was opened with via `drx.modal.data()`, and resolves the caller's promise via `drx.modal.close(...)` — here, a form that edits a record and hands the edited copy back.

The page renders inside a native `<dialog class="x-modal">` that covers the whole viewport and is transparent, so the page lays itself out: a centered panel, a drawer, or a full screen. Style the backdrop with `::backdrop` in the app's `<style>`.

```html drx
<x-app>
    <style>::backdrop { background: rgb(0 0 0 / 40%); }</style>

    <x-page name="editPerson">
        <style>
            .panel { position: fixed; inset: 0; margin: auto; width: fit-content; height: fit-content; display: grid; gap: 8px; padding: 16px; background: white; border-radius: 8px; }
        </style>

        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                save() { drx.modal.close(drx.modal.data()); }
            });
        </script>

        <div class="panel">
            <label>
                Name
                <input value="{{modal.data.name()}}" onchange="modal.data.name(event.target.value)">
            </label>
            <label>
                Age
                <input type="number" value="{{modal.data.age()}}" onchange="modal.data.age(Number(event.target.value))">
            </label>
            <button onclick="modal.close()">Cancel</button>
            <button onclick="save()">Save</button>
        </div>
    </x-page>

    <x-page name="home">
        <x-variable name="person" type="any">{ "name": "Ada Lovelace", "age": 30 }</x-variable>

        <script type="application/typescript">
            export default DRX.definePage(drx => class {
                async edit() {
                    const result = await drx.pages.editPerson.showModal({ data: drx.page.variables.person.get() });
                    if (result) drx.page.variables.person.set(result);
                }
            });
        </script>

        <p>{{person.name()}}, age {{person.age()}}</p>
        <button onclick="edit()">Edit</button>
    </x-page>

    <x-page-container page="home"></x-page-container>
</x-app>
```

<!-- drx/nodes/x-page-container.md -->

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

<!-- drx/nodes/x-component.md -->

# \<x-component>

A reusable unit with no access to app or page state — anything it needs is declared on the component itself, on a component it's [nested in](#nested-components), or passed in via `<x-property>`/`<x-event>`. Use it once something is genuinely reusable across pages or apps and benefits from that isolation; otherwise prefer `<x-page-container>`.

```html
<x-component>
    <script type="application/typescript">
        export default DRX.defineComponent(drx => class {
            onMount() { }
            onUnmount() { }
        });
    </script>
    <style></style>
    <x-type></x-type>
    <x-property></x-property>
    <x-event></x-event>
    <x-variable></x-variable>
    <x-service></x-service>
    <x-asset></x-asset>
    <x-api></x-api>
    <x-component></x-component>

    <!-- Template -->
</x-component>
```

| Attribute | Description           |
| --------- | --------------------- |
| **name**  | Name of the component |

## Examples

```html drx
<x-app>
    <x-component name="alert">
        <x-property name="text" type="string"></x-property>
        <div class="alert">{{text()}}</div>
    </x-component>

    <x-component-instance component="alert" text="Disk space low"></x-component-instance>
</x-app>
```

#### Emitting an event from the template

A declared `<x-event>` is also callable bare from the component's own template, same as a script method — no `<script>` needed on either side.

```html drx
<x-app>
    <x-component name="alert">
        <x-event name="dismissed" type="string"></x-event>
        <button onclick="dismissed('dismissed by user')">Dismiss</button>
    </x-component>

    <x-component-instance component="alert" dismissed="console.log(event)"></x-component-instance>
</x-app>
```

## Nested components

A component declared inside another component inherits everything declared on the components that enclose it: their variables, properties, events, script methods, types, assets, services, apis and components. Its own declarations win on a name clash. It reads and writes the enclosing component instance it's rendered in, so a nested component and its parent share that state. Templates and scripts see the same set: `drx.component.variables`, `drx.component.props`, `drx.component.events`, `drx.services` and `drx.apis` include what the enclosing components declare.

Every component, nested or not, uses the app's [`<x-libraries>`](x-libraries.md) and [`<x-packages>`](x-packages.md); a component never declares its own.

```html drx
<x-app>
    <x-component name="counter">
        <x-variable name="count" type="number">0</x-variable>
        <x-component name="incrementButton">
            <button onclick="count(value => value + 1)">Add one</button>
        </x-component>
        <p>Count: {{count()}}</p>
        <x-component-instance component="incrementButton"></x-component-instance>
    </x-component>

    <x-component-instance component="counter"></x-component-instance>
</x-app>
```

## Shadow DOM

Every component instance renders its markup into its own open shadow root. That boundary is what isolates the component: outside rules can't reach in, its rules can't leak out, and each instance has its own ids.

- **CSS rules don't cross it**; inherited values (custom properties, `font`, `color`) do.
- **Query the instance's own markup through `drx.component.root`** — each instance has its own root, so two instances never find each other's elements.
- **Events from inside are retargeted** at document level; use `event.composedPath()` there.

```html drx
<x-app>
    <x-component name="field">
        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                focusInput() { (drx.component.root.getElementById('input') as HTMLInputElement).focus(); }
            });
        </script>
        <p><input id="input"> <button onclick="focusInput()">Focus</button></p>
    </x-component>

    <x-component-instance component="field"></x-component-instance>
    <x-component-instance component="field"></x-component-instance>
</x-app>
```

## Styling

A component is styled only by its own `<style>`, which is what makes it safe to reuse: app and page rules never reach its markup, and its rules never leak out.

| Reaches a component's markup | |
| --- | --- |
| The component's own `<style>` | Yes |
| App and page `<style>` rules | No |
| Inherited values from where it's placed: custom properties, `font`, `color` | Yes |
| CSS a library injects into the document `<head>` | Yes |

- Use the app's tokens (`var(--accent)`) to match its design without depending on its classes.
- Set `font-family` on the component's own elements to keep its font wherever it's used; otherwise it inherits the font of its surroundings.
- `@font-face` and `@property` in a component's style work, so a component can bring its own font.
- `{{ }}` works in a component's style with its locals, including properties: `.badge { background: {{tone()}}; }`.
- Declare the `@keyframes` a component uses in its own style.
- `:root`, `html` and `body` match nothing in a component's style.
- A component is rendered as `display: contents`; give its markup a root element to control its own layout.

```html drx
<x-app>
    <style>
        :root { --accent: #0f766e; }
        body { font-family: Georgia, serif; }
        .label { color: red; }
    </style>

    <x-component name="badge">
        <style>
            .badge { font-family: system-ui, sans-serif; }
            .label { color: var(--accent); font-weight: 600; }
        </style>
        <span class="badge"><span class="label">Component: own font, app token, not the app's red</span></span>
    </x-component>

    <p class="label">App label: red, inherited font</p>
    <x-component-instance component="badge"></x-component-instance>
</x-app>
```

## Scripting

`<x-component>`'s script is instantiated once per `<x-component-instance>` that resolves to it. A component never receives the app's or page's state — anything it needs must be declared on the component itself (its own `<x-variable>`, `<x-property>`, `<x-event>`, `<x-service>`, `<x-api>`), on a component it's [nested in](#nested-components), or passed in as a prop. The app's libraries and packages are the exception: every component uses them.

```ts
export default DRX.defineComponent(drx => class {
    onMount() { }
    onUnmount() { }
});
```

### Lifecycle

| Hook          | Called                                                               |
| ------------- | -------------------------------------------------------------------- |
| `onMount()`   | Once, right after this component instance's own template has mounted |
| `onUnmount()` | When this component instance unmounts                                |

### The `drx` parameter

```ts
interface Drx {
    component: {
        /** This component instance's <x-variable> declarations and those of the components it's nested in, keyed by name. */
        variables: Record<string, {
            /** Reads the current value. */
            get(): any;
            /** Writes a new value, or an updater function that receives the current value and returns the next one. */
            set(update: any | ((value: any) => any)): void;
            /** Resets the variable back to its declared initial value. */
            reset(): void;
            /** Validates the current value against the variable's declared type; each error carries a message and a path. */
            validate(): [value: any | undefined, errors: { message: string; path: string }[]];
            /** Calls back with the current value immediately and on every change; returns an unsubscribe function. Subscriptions end automatically when the owner unmounts. */
            subscribe(callback: (value: any) => void): () => void;
        }>;
        /** The declared <x-property> values passed in by the consumer, including those of the components it's nested in, keyed by name. Read-only. */
        props: Record<string, () => any>;
        /** The declared <x-event>s this instance can fire, including those of the components it's nested in, keyed by name. */
        events: Record<string, { emit(payload?: any): void }>;
        /** This component instance's shadow root. */
        root: ShadowRoot;
    };

    /** Every <x-api> declared on this component or a component it's nested in -- never the app's. */
    apis: Record<string, {
        /** The api's base url. */
        url: string;
        endpoints: Record<string, {
            request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
                raw: Response;
                value(): Promise<any>;
            }>;
        }>;
    }>;

    /** Every <x-service> declared on this component or a component it's nested in -- never the app's. */
    services: Record<string, Record<string, (...args: any[]) => any>>;

    /** Every library declared on the app, keyed by the library's name. Each is the library's single shared instance. */
    libraries: Record<string, {
        /** The library's top-level <x-variable> declarations, keyed by name -- same shape as drx.component.variables. */
        variables: Record<string, any>;
        /** The library's top-level <x-service> instances, keyed by name. */
        services: Record<string, Record<string, (...args: any[]) => any>>;
        /** The library's top-level <x-api> declarations, keyed by name -- same shape as drx.apis. */
        apis: Record<string, any>;
    }>;
}
```

There is no `drx.app`, `drx.page`, `drx.router`, or `drx.modal` — a component script cannot reach any of them, by design.

### Calling script methods from the template

Any method on the component's own class is callable bare from that instance's own template — in `{{ }}` expressions and in plain attributes like `onclick`:

```html
<x-component name="counter">
    <script type="application/typescript">
        export default DRX.defineComponent(drx => class {
            log() { console.log('Hello from the component'); }
        });
    </script>
    <button onclick="log()">Log</button>
</x-component>
```

### Examples

#### An element calling a component function

A button's `onclick` calls a method declared directly on the component's own script.

```html drx
<x-app>
    <x-component name="counter">
        <x-variable name="count" type="number">0</x-variable>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                increment() { drx.component.variables.count.set(value => value + 1); }
            });
        </script>

        <button onclick="increment()">Clicked {{count()}} times</button>
    </x-component>

    <x-component-instance component="counter"></x-component-instance>
</x-app>
```

#### A component emitting an event from a script

A component fires a declared `<x-event>` via `drx.component.events.<name>.emit(payload?)`; the consumer catches it with a plain attribute on the `<x-component-instance>`, matching the event's name.

```html drx
<x-app>
    <x-component name="alert">
        <x-event name="dismissed" type="string"></x-event>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                dismiss() { drx.component.events.dismissed.emit('dismissed by user'); }
            });
        </script>

        <button onclick="dismiss()">Dismiss</button>
    </x-component>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onAlertDismissed(reason) { console.log(reason); }
        });
    </script>

    <x-component-instance component="alert" dismissed="onAlertDismissed(event)"></x-component-instance>
</x-app>
```

<!-- drx/nodes/x-component-instance.md -->

# \<x-component-instance>

Instantiates a declared `<x-component>` by name. Use it wherever you need to drop a reusable component into a template, wiring its declared properties and events through plain attributes. See [Locals](../concepts/locals.md#resets) for exactly what does (and doesn't) carry over into the instance.

```html
<x-component-instance></x-component-instance>
```

| Attribute         | Description                                               |
| ----------------- | --------------------------------------------------------- |
| **{ƒ} component** | Name of the component to instantiate                      |
| ...               | Binds to a declared `x-property` ({ƒ}) or `x-event` ((ƒ)) |

## Resolution

`component` is resolved where the instance is written, not where it ends up rendered:

- **A plain name** looks at the components declared directly inside the current component, then directly inside each component enclosing it, then directly inside the app. The nearest match wins; each level only searches its direct children, never deeper.
- **A namespaced name** such as `ui.button` finds the library named `ui` in the [`<x-libraries>`](x-libraries.md) of the app or library it is used in, and takes that library's top-level `button`.

## Example
```html drx
<x-app>
    <x-component name="alert">
        <x-property name="text" type="string"></x-property>
        <div class="alert">{{text()}}</div>
    </x-component>

    <x-component-instance component="alert" text="Disk space low"></x-component-instance>
</x-app>
```

<!-- drx/nodes/x-property.md -->

# \<x-property>

Declares one of a component's inputs — an entry point exposed as a read-only, callable signal in the template (`level()`) and in the component's own script (`drx.component.props.level()`). Use it whenever a component needs data from its consumer, instead of hardcoding a value or relying on a variable declared inside the component itself. See [Locals](../concepts/locals.md) for signal call semantics and how properties rank against other locals.

```html
<x-property></x-property>
```

| Attribute | Description                                    |
| --------- | ----------------------------------------------- |
| **name**  | Name of the property                             |
| type?     | Type used to validate the value, defaults to `any` |

## Examples

### Passing a property to a component

```html drx
<x-app>
    <x-component name="alert">
        <x-property name="level" type="string"></x-property>
        <div class="alert" class.critical="level() === 'error'">{{level()}}</div>
    </x-component>

    <x-component-instance component="alert" level="error"></x-component-instance>
</x-app>
```

### Optional properties

A property the consumer doesn't pass is `undefined`, so it can be given a fallback in the template.

```html drx
<x-app>
    <x-component name="greeting">
        <x-property name="name" type="string"></x-property>
        <p>Hello {{name() ?? 'stranger'}}</p>
    </x-component>

    <x-component-instance component="greeting" name="Ada"></x-component-instance>
    <x-component-instance component="greeting"></x-component-instance>
</x-app>
```

### Reading a property from a component script

Outside a template, a property is read through `drx.component.props.<name>()` rather than called directly like the template-local signal above.

```html drx
<x-app>
    <x-component name="alert">
        <x-property name="text" type="string"></x-property>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                log() { console.log(drx.component.props.text()); }
            });
        </script>

        <button onclick="log()">Log text</button>
    </x-component>

    <x-component-instance component="alert" text="Disk space low"></x-component-instance>
</x-app>
```

<!-- drx/nodes/x-event.md -->

# \<x-event>

Declares one of a component's outputs — an exit point the component fires via `drx.component.events.<name>.emit(payload?)`, caught by a matching handler attribute on the consumer's `<x-component-instance>`. Use it whenever a component needs to notify its consumer of something happening inside it, instead of reaching outside its own isolation.

```html
<x-event></x-event>
```

| Attribute | Description                                    |
| --------- | ----------------------------------------------- |
| **name**  | Name of the event                                |
| type?     | Type used to validate the payload, defaults to `any` |

## Example
```html drx
<x-app>
    <x-component name="alert">
        <x-event name="dismissed" type="string"></x-event>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                dismiss() { drx.component.events.dismissed.emit('dismissed by user'); }
            });
        </script>

        <button onclick="dismiss()">Dismiss</button>
    </x-component>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onAlertDismissed(reason) { console.log(reason); }
        });
    </script>

    <x-component-instance component="alert" dismissed="onAlertDismissed(event)"></x-component-instance>
</x-app>
```

<!-- drx/nodes/x-variable.md -->

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
    <button onclick="count(value => value + 1)">Clicked {{count()}} times</button>
</x-app>
```

### Reacting to changes from a script

`subscribe` calls back with the current value and again on every change, and returns a function that unsubscribes. Subscriptions end automatically when the owner unmounts.

```html drx
<x-app>
    <x-variable name="count" type="number">0</x-variable>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() {
                drx.app.variables.count.subscribe(value => console.log(`count is ${value}`));
            }
        });
    </script>

    <button onclick="count(value => value + 1)">Clicked {{count()}} times</button>
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
                drx.app.variables.theme.set(theme => theme === 'light' ? 'dark' : 'light');
                console.log(`Theme is now ${drx.app.variables.theme.get()}`);
            }
        });
    </script>

    <p>Theme: {{theme()}}</p>
</x-app>
```

<!-- drx/nodes/x-type.md -->

# \<x-type>

Declares a named, reusable [TSON](../core/tson/index.html) schema referenced by name from any `type` attribute, or by `{ "type": "ref", "id": "<name-of-type>" }` from within another inline TSON definition (such as an `<x-body>`/`<x-response>`). Use it to validate `<x-variable>`, `<x-property>`/`<x-event>`, and to avoid repeating the same schema inline in multiple places.

```html
<x-type></x-type>
```

| Attribute | Description      |
| --------- | ---------------- |
| **name**  | Name of the type |

## Resolution

A type name resolves against the types declared on the owner it's used in: the app for the app and its pages, or the component and every component enclosing it. A namespaced name such as `ui.priority` takes the top-level `priority` type of the [`ui` library](x-libraries.md).

## Example
```html drx
<x-app>
    <x-type name="priority">{ "type": "enum", "flags": ["low", "medium", "high"] }</x-type>

    <x-variable name="taskPriority" type="priority">"medium"</x-variable>
    <p>{{taskPriority()}}</p>
</x-app>
```

<!-- drx/nodes/x-service.md -->

# \<x-service>

A plain class for behavior not tied to one page or component, reached via `drx.services.<name>.<method>(...)`. Use it to share logic (logging, analytics, formatting helpers) across pages/components without duplicating it or forcing an unrelated owner on it.

```html
<x-service>
    <script type="application/typescript">
        export default DRX.defineService(drx => class {
            method() { }
        });
    </script>
</x-service>
```

| Attribute | Description         |
| --------- | ------------------- |
| **name**  | Name of the service |

## Example
```html drx
<x-app>
    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                log(message) { console.log(message); }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.log('App mounted'); }
        });
    </script>
</x-app>
```

## Scripting

`<x-service>` is a plain class, not tied to one page or component. It has no template and no shadow root, and it is only ever constructed with `new` — never mounted.

```ts
export default DRX.defineService(drx => class {
    method() { }
});
```

### Lifecycle

None. `onMount()`/`onUnmount()` are never called on a service instance and should not be declared on one.

### The `drx` parameter

```ts
interface Drx {
    /** Only present on services declared directly on the app -- not on library or component services. */
    app?: {
        /** The app's top-level <x-variable> declarations, keyed by name. */
        variables: Record<string, {
            get(): any;
            set(update: any | ((value: any) => any)): void;
            reset(): void;
            validate(): [value: any, errors: unknown[]];
            subscribe(callback: (value: any) => void): () => void;
        }>;
    };

    /** Only present on services declared directly on a <x-library> -- same shape as app. */
    library?: {
        /** The library's top-level <x-variable> declarations, keyed by name. */
        variables: Record<string, any>;
    };

    /** Every <x-api> declared on the same owner (app, library or component), keyed by name. */
    apis: Record<string, {
        /** The api's base url. */
        url: string;
        endpoints: Record<string, {
            request(options?: { parameters?: Record<string, string>; headers?: Record<string, string>; body?: any }): Promise<{
                raw: Response;
                value(): Promise<any>;
            }>;
        }>;
    }>;

    /** Every sibling <x-service> declared on the same owner (app or component), keyed by name. */
    services: Record<string, Record<string, (...args: any[]) => any>>;

    /** Every library declared on the app, keyed by the library's name. */
    libraries: Record<string, {
        /** The library's top-level <x-variable> declarations, keyed by name. */
        variables: Record<string, any>;
        /** The library's top-level <x-service> instances, keyed by name. */
        services: Record<string, Record<string, (...args: any[]) => any>>;
        /** The library's top-level <x-api> declarations, keyed by name. */
        apis: Record<string, any>;
    }>;
}
```

### Calling script methods from the template

Not applicable — a service has no template of its own. Its methods are reached from an app, page, or component script via `drx.services.<name>.<method>(...)`.

### Examples

#### An app script calling a service

Calls a declared `<x-service>` from the app's own `onMount()`.

```html drx
<x-app>
    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                log(message) { console.log(message); }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.log('App mounted'); }
        });
    </script>
</x-app>
```

#### A component using its own service

Calls a `<x-service>` declared inside the component itself, from the component's own `onMount()`. That service is only reachable from this component's own script — not from the app or from other components.

```html drx
<x-app>
    <x-component name="widget">
        <x-service name="widgetLogger">
            <script type="application/typescript">
                export default DRX.defineService(drx => class {
                    log(message) { console.log(message); }
                });
            </script>
        </x-service>

        <script type="application/typescript">
            export default DRX.defineComponent(drx => class {
                onMount() { drx.services.widgetLogger.log('Widget mounted'); }
            });
        </script>

        <div>Widget</div>
    </x-component>

    <x-component-instance component="widget"></x-component-instance>
</x-app>
```

#### A service calling another service

`logger` reaches its sibling `formatter` via `drx.services`, since both are declared on the same app.

```html drx
<x-app>
    <x-service name="formatter">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                currency(amount) { return `$${amount.toFixed(2)}`; }
            });
        </script>
    </x-service>

    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                logPrice(amount) { console.log(drx.services.formatter.currency(amount)); }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.logPrice(19.9); }
        });
    </script>
</x-app>
```

#### A service setting an app variable

`session` writes the app-level `user` variable, and the app template updates reactively without the caller handling the result.

```html drx
<x-app>
    <x-variable name="user" type="string">"Guest"</x-variable>

    <x-service name="session">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                signIn(name) { drx.app.variables.user.set(name); }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.session.signIn('Ada'); }
        });
    </script>

    <div>Signed in as {{user()}}</div>
</x-app>
```

#### A service calling a declared api

`logger` reaches the app-level `todoApi` via `drx.apis`, since both are declared on the same app.

```html drx
<x-app>
    <x-api name="todoApi" url="https://jsonplaceholder.typicode.com">
        <x-endpoint name="list" path="/todos" method="GET">
            <x-response type="array"></x-response>
        </x-endpoint>
    </x-api>

    <x-service name="logger">
        <script type="application/typescript">
            export default DRX.defineService(drx => class {
                async logTodos() {
                    const response = await drx.apis.todoApi.endpoints.list.request();
                    console.log(await response.value());
                }
            });
        </script>
    </x-service>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            onMount() { drx.services.logger.logTodos(); }
        });
    </script>
</x-app>
```

<!-- drx/nodes/x-asset.md -->

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

<!-- drx/nodes/x-packages.md -->

# \<x-packages>

Declares npm package versions available to a script's bare imports. Use it when a `<script>` needs a third-party dependency. Only the app declares packages, at most one `<x-packages>`; every page, component and service script in the app uses them.

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

<!-- drx/nodes/x-dependency-tree.md -->

# \<x-dependency-tree>

Caches the resolved dependency graph for the app's `<x-packages>` declarations. It's written by tooling during compilation, not hand-authored — treat its content as opaque generated output rather than something to edit directly.

```html
<x-dependency-tree></x-dependency-tree>
```

No attributes, content is a compiler-generated JSON object.

## Example
```html drx
<x-app>
    <x-packages>{ "lodash": "^4.17.21" }</x-packages>
    <x-dependency-tree>{ }</x-dependency-tree>

    <h1>Home</h1>
</x-app>
```

<!-- drx/nodes/x-pwa-metadata.md -->

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

<!-- drx/nodes/x-api.md -->

# \<x-api>

Declares an HTTP client, reached via `drx.apis.<name>`. Use it to centralize a backend's base URL and request/response shapes instead of hand-rolling `fetch` calls throughout scripts.

```html
<x-api>
    <x-endpoint>
        <x-parameter></x-parameter>
        <x-header></x-header>
        <x-body></x-body>
        <x-response></x-response>
    </x-endpoint>
</x-api>
```

| Attribute | Description         |
| --------- | ------------------- |
| **name**  | Name of the api     |
| **url**   | Base url of the api |

## Example

Against the public [JSONPlaceholder](https://jsonplaceholder.typicode.com) API:

```html drx
<x-app>
    <x-type name="todo">{ "type": "object", "properties": { "userId": { "type": "number" }, "id": { "type": "number" }, "title": { "type": "string" }, "completed": { "type": "boolean" } } }</x-type>

    <x-api name="jsonPlaceholder" url="https://jsonplaceholder.typicode.com">
        <x-endpoint name="list" path="/todos" method="GET">
            <x-response>{ "type": "array", "itemDefinition": { "type": "ref", "id": "todo" } }</x-response>
        </x-endpoint>
        <x-endpoint name="create" path="/todos" method="POST">
            <x-body>{ "type": "object", "properties": { "userId": { "type": "number" }, "title": { "type": "string" }, "completed": { "type": "boolean" } } }</x-body>
            <x-response>{ "type": "ref", "id": "todo" }</x-response>
        </x-endpoint>
        <x-endpoint name="remove" path="/todos/{id}" method="DELETE">
            <x-parameter name="id" required="true"></x-parameter>
        </x-endpoint>
    </x-api>

    <script type="application/typescript">
        export default DRX.defineApp(drx => class {
            async onMount() {
                const list = await drx.apis.jsonPlaceholder.endpoints.list.request();
                console.log(await list.value());

                const created = await drx.apis.jsonPlaceholder.endpoints.create.request({ body: { userId: 1, title: 'Write docs', completed: false } });
                console.log(await created.value());

                await drx.apis.jsonPlaceholder.endpoints.remove.request({ parameters: { id: '1' } });
            }
        });
    </script>
    <h1>Todos</h1>
</x-app>
```

## \<x-endpoint>

| Attribute | Description                                           |
| --------- | ----------------------------------------------------- |
| **name**  | Name of the endpoint                                  |
| **path**  | Path appended to the api's url, may include `{param}` |
| method?   | HTTP method, defaults to `GET`                        |

## \<x-parameter>

| Attribute    | Description                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------- |
| **name**     | Name of the query or path parameter. Parameters not used in the path are sent as query parameters |
| required?    | Whether the parameter is required, defaults to `false`                                            |
| description? | Description of the parameter                                                                      |

## \<x-header>

| Attribute    | Description                                         |
| ------------ | --------------------------------------------------- |
| **name**     | Name of the header                                  |
| required?    | Whether the header is required, defaults to `false` |
| description? | Description of the header                           |

## \<x-body>

Holds an inline [TSON](../core/tson/index.html) definition, the same JSON-content shape as `<x-type>`, used to validate the request body. Defaults to `{ "type": "any" }` when empty. Its definition may itself be a `{ "type": "ref", "id": "..." }` pointing at a named `<x-type>` declared on the enclosing app or component, if the shape is meant to be shared.

| Attribute | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| encoding? | `json`, `form-data` or `urlencoded`, defaults to `json`. Controls how an object `body` is sent |

```html
<x-body>{ "type": "object", "properties": { "userId": { "type": "number" }, "title": { "type": "string" }, "completed": { "type": "boolean" } } }</x-body>
```

With `form-data` or `urlencoded`, the object passed as `body` is converted to `FormData` or `URLSearchParams`: arrays become repeated fields, `Blob`/`File` values are appended as files, nested objects are JSON-stringified and `null`/`undefined` values are skipped. A ready-made `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer` or string passed as `body` is always sent as-is, whatever the encoding, and `Content-Type` is left to the browser. With `json`, `Content-Type` defaults to `application/json`.

```html
<x-body encoding="form-data">{ "type": "object", "properties": { "name": { "type": "string" }, "file": { "type": "any" } } }</x-body>
```

## \<x-response>

Holds an inline [TSON](../core/tson/index.html) definition, the same JSON-content shape as `<x-type>`, used to validate the response body. Defaults to `{ "type": "any" }` when empty. Its definition may itself be a `{ "type": "ref", "id": "..." }` pointing at a named `<x-type>` declared on the enclosing app or component, if the shape is meant to be shared.

```html
<x-response>{ "type": "ref", "id": "todo" }</x-response>
```

<!-- drx/nodes/x-route.md -->

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

<!-- drx/nodes/x-if.md -->

# \<x-if>

Conditionally renders its children based on a reactive expression. Use it to show or hide part of a template rather than toggling visibility with CSS, since the content isn't mounted at all when the condition is false.

Chain additional branches with nested `<x-else-if>` (repeatable) and `<x-else>` (at most one), in that order, as the last children of `<x-if>`. Only the first branch whose condition is true renders — `<x-if>`'s own content is checked first, then each `<x-else-if>` in order, falling back to `<x-else>` if none match.

```html
<x-if>
    <!-- Template -->
    <x-else-if>
        <!-- Template -->
    </x-else-if>
    <x-else>
        <!-- Template -->
    </x-else>
</x-if>
```

| Attribute        | Description                                      |
| ---------------- | ------------------------------------------------ |
| **(ƒ) condition** | Evaluated to decide whether the template renders |

`<x-else-if>` takes the same **(ƒ) condition** attribute; `<x-else>` takes none.

## Example
```html drx
<x-app>
    <x-variable name="on" type="boolean"></x-variable>
    <button onclick="on(value => !value)">
        Toggle
    </button>
    <x-if condition="on()">
        <p>On</p>
        <x-else-if condition="on() === false">
            <p>Off</p>
        </x-else-if>
        <x-else>
            <p>Unset</p>
        </x-else>
    </x-if>
</x-app>
```

<!-- drx/nodes/x-for.md -->

# \<x-for>

Renders its children once per entry in a collection. Use it for any list-driven UI where the number of rendered items tracks a reactive array or object.

```html
<x-for>
    <!-- Template -->
</x-for>
```

| Attribute    | Description                                                |
| ------------ | ---------------------------------------------------------- |
| **(ƒ) each** | Expression resolving to the collection to iterate          |
| **as**       | Name each item is exposed as within the template           |
| index?       | Name the item's index is exposed as                        |
| key?         | Name the item's key is exposed as                          |
| track?       | Property path used to identify each item across re-renders |

## Example
```html drx
<x-app>
    <x-variable name="items" type="array">["Milk", "Eggs", "Bread"]</x-variable>
    <x-for each="items()" as="item">
        <li>{{item()}}</li>
    </x-for>
</x-app>
```

<!-- drx/nodes/x-icon.md -->

# \<x-icon>

Mounts as an `<svg>`, resolving `name` against the built-in icon set. Use it instead of inlining raw SVG markup or an `<x-asset>` image whenever a built-in icon covers the need.

```html
<x-icon></x-icon>
```

| Attribute | Description                                                          |
| --------- | ---------------------------------------------------------------------|
| **{ƒ} name** | Name of the icon to render                                           |
| ...       | Any other attribute binds as an expression to the underlying `<svg>` |

## Example
```html drx
<x-app>
    <x-variable name="expanded" type="boolean">false</x-variable>
    <x-icon name="{{expanded() ? 'chevron-up' : 'chevron-down'}}"></x-icon>
</x-app>
```

<!-- core/tson/index.md -->

# TSON

TSON (Typed JSON) is a schema system for describing and validating JSON-shaped data — plain JSON objects that describe a type, paired with a parser that checks a value against that shape and either returns the value or a list of errors.

A definition is plain, serializable JSON with a `type` field — nothing to import or construct to write one by hand. Edit the value below and the result updates live:

```json tson
{
    "definition": { "type": "enum", "flags": ["low", "medium", "high"] },
    "value": "medium"
}
```

## Types

- [`any`](any.md)
- [`string`](string.md)
- [`number`](number.md)
- [`boolean`](boolean.md)
- [`object`](object.md)
- [`array`](array.md)
- [`record`](record.md)
- [`enum`](enum.md)
- [`union`](union.md)
- [`ref`](ref.md)

<!-- core/tson/any.md -->

# `any`

No constraints — any non-`null`/`undefined` value passes through unchanged. `type="any"` is also the natural fallback whenever no type is declared at all.

```ts
interface TsonAnyDefinition {
    type: 'any';
    default?: { value: any };
}
```

```json tson
{
    "definition": { "type": "any" },
    "value": { "anything": "goes" }
}
```

<!-- core/tson/string.md -->

# `string`

```ts
interface TsonStringDefinition {
    type: 'string';
    min?: number;
    max?: number;
    match?: string;
    default?: { value: string };
}
```

| Field | Description |
| --- | --- |
| min? | Minimum length |
| max? | Maximum length |
| match? | A regex source the value must match |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "string", "min": 3, "max": 40 },
    "value": "hi"
}
```

<!-- core/tson/number.md -->

# `number`

```ts
interface TsonNumberDefinition {
    type: 'number';
    min?: number;
    max?: number;
    integer?: boolean;
    default?: { value: number };
}
```

| Field | Description |
| --- | --- |
| min? | Minimum value |
| max? | Maximum value |
| integer? | Declares the value as integer-only for `accepts()` compatibility checks — not currently enforced by `.parse()` itself; a non-integer value still passes parsing even with `integer: true` set |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "number", "min": 0, "max": 10 },
    "value": 15
}
```

<!-- core/tson/boolean.md -->

# `boolean`

```ts
interface TsonBooleanDefinition {
    type: 'boolean';
    default?: { value: boolean };
}
```

| Field | Description |
| --- | --- |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "boolean" },
    "value": "true"
}
```

<!-- core/tson/object.md -->

# `object`

```ts
interface TsonObjectDefinition {
    type: 'object';
    properties?: Record<string, TsonDefinition>;
    /** Applied via Object.setPrototypeOf to the parsed result -- an advanced, rarely-needed field. */
    prototype?: any;
    default?: { value: Record<string, any> };
}
```

| Field | Description |
| --- | --- |
| properties? | Named property definitions. Only these are copied onto the result — anything else on the input is dropped, and if any one property fails to validate the whole result collapses to `null`. Omitted (or `{}`), the object is unconstrained and passed through unchanged. |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": {
        "type": "object",
        "properties": {
            "name": { "type": "string" },
            "age": { "type": "number" }
        }
    },
    "value": { "name": "Alice", "age": 30, "extra": "dropped" }
}
```

<!-- core/tson/array.md -->

# `array`

```ts
interface TsonArrayDefinition {
    type: 'array';
    itemDefinition?: TsonDefinition;
    min?: number;
    max?: number;
    default?: { value: any[] };
}
```

| Field | Description |
| --- | --- |
| itemDefinition? | Definition each item must satisfy. Every item is checked (not just until the first failure); if any one fails, the whole array collapses to `null`. Omitted, items pass through unvalidated. |
| min? | Minimum length |
| max? | Maximum length |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "array", "itemDefinition": { "type": "number" } },
    "value": [1, 2, "three"]
}
```

<!-- core/tson/record.md -->

# `record`

An object with dynamic keys — every property shares one value type, unlike [`object`](object.md)'s fixed, named properties.

```ts
interface TsonRecordDefinition {
    type: 'record';
    property?: TsonDefinition;
    default?: { value: Record<string, any> };
}
```

| Field | Description |
| --- | --- |
| property? | Definition every value in the record must satisfy. Every entry is checked; if any one fails, the whole record collapses to `null`. Omitted, values pass through unvalidated. |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "record", "property": { "type": "number" } },
    "value": { "a": 1, "b": "two" }
}
```

<!-- core/tson/enum.md -->

# `enum`

One of a fixed set of literal string or number values.

```ts
interface TsonEnumDefinition<T extends string | number = any> {
    type: 'enum';
    flags: T[];
    default?: { value: T };
}
```

| Field | Description |
| --- | --- |
| **flags** | The allowed literal values — all strings or all numbers |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "enum", "flags": ["low", "medium", "high"] },
    "value": "urgent"
}
```

<!-- core/tson/union.md -->

# `union`

Any one of several definitions — parsing tries each in order and returns the first that matches with no errors.

```ts
interface TsonUnionDefinition {
    type: 'union';
    union: readonly TsonDefinition[];
    default?: { value: any };
}
```

| Field | Description |
| --- | --- |
| **union** | The candidate definitions, tried in order. Each is tried fail-fast, so a mismatch always reports one generic error, not which member(s) came closest. |
| default? | `{ value }` substituted when the input is `null`/`undefined` |

```json tson
{
    "definition": { "type": "union", "union": [{ "type": "string" }, { "type": "number" }] },
    "value": true
}
```

<!-- core/tson/ref.md -->

# `ref`

A placeholder that points at another named type by id — not something you parse directly. It exists so a definition can reference a type before that type is known/resolved; a consumer resolves every `ref` to its real definition before parsing ever sees it.

```ts
interface TsonRefDefinition {
    type: 'ref';
    id: string;
}
```

| Field | Description |
| --- | --- |
| **id** | The id of the type this reference points at |

```json tson
{
    "definition": { "type": "ref", "id": "priority" },
    "value": "medium"
}
```
