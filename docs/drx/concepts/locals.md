# Locals

A local is any bare identifier a template can reference (`{{ }}`, `onclick`, `class.`/`style.`). A signal local is callable: `name()` reads, `name(value)` or `name(current => next)` writes. A nested path is a signal too, and only the last segment is called: `user.profile.name()`, never `user().profile.name`.

Each level below adds locals on top of what it inherited; lower in the list wins on a name clash.

## App

1. `asset.<name>` — plain value, read-only
2. `router`
   1. `route()` — signal, read-only in practice
   2. `params.<n>()` — signal, read-only in practice
   3. `active(path)` — plain method
   4. `navigate(path)` — plain method
3. app script methods — function, call only
4. app `<x-variable>`s — signal

## Page

Adds on top of App:

5. page script methods — function, call only
6. page `<x-variable>`s — signal

## Component

Isolated — App/Page locals never apply here:

1. `asset.<name>` — plain value, read-only
2. component script methods — function, call only
3. component `<x-variable>`s — signal
4. `<x-property>` values — signal, read-only
5. `<x-event>`s — function, call only (`name(payload?)` fires it)

## Resets

- `<x-for>` adds `as`/`index`/`key` for its own body only — each a read-only signal.
- `<x-route>` replaces `router` for its own body only, merging in its matched params.
- `<x-page-container>` restarts from **App**'s locals (not the embedding page's), plus whichever `router` was active.
- `<x-component-instance>` starts a fresh **Component** list — nothing from outside carries in.
