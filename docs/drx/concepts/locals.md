# Locals

A local is any bare identifier a template can reference (`{{ }}`, `onclick`, `class.`/`style.`). A signal local is callable: `name()` reads, `name(value)` or `name(current => next)` writes. A nested path is a signal too, and only the last segment is called: `user.profile.name()`, never `user().profile.name`.

Each level below adds locals on top of what it inherited; lower in the list wins on a name clash.

## App

1. app [`<x-libraries>`](../nodes/x-libraries.md) namespaces
2. `assets`
3. [`settings`](../nodes/x-settings.md)
4. [`router`](../nodes/x-route.md)
5. app script methods
6. app `<x-variable>`s

## Page

Adds on top of App:

7. page script methods
8. page `<x-variable>`s

## Component

Isolated — App/Page locals never apply here. A [nested component](../nodes/x-component.md#nested-components) starts from the locals of the component instance enclosing it, then adds:

1. the app's [`<x-libraries>`](../nodes/x-libraries.md) namespaces
2. `assets` — names it doesn't declare fall back to the enclosing instance's `assets`
3. [`settings`](../nodes/x-settings.md) — always the app's settings
4. component script methods
5. component `<x-variable>`s
6. `<x-property>` values
7. `<x-event>`s

## Resets

- `<x-for>` adds `as`/`index`/`key` for its own body only.
- `<x-route>` replaces `router` for its own body only, merging in its matched params.
- `<x-page-container>` restarts from **App**'s locals (not the embedding page's), plus whichever `router` was active.
- A page opened with [`showModal(...)`](../nodes/x-page.md) restarts from **App**'s locals, plus `modal`, before adding its own **Page** locals.
- `<x-component-instance>` starts a fresh **Component** list — nothing from outside carries in, except the enclosing component instance's locals when the component is nested inside another.
