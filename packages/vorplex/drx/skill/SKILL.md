---
name: building-drx-apps
description: Builds new applications and migrates existing static HTML/CSS/JS sites into DRX, a declarative `<x-*>` markup language that compiles to a reactive Vorplex runtime with no build step. Use whenever the task is to scaffold a DRX app, write or edit `<x-app>`/`<x-page>` markup or `.drx` files, or port/convert/migrate an existing HTML page or site into DRX. Covers the full `<x-*>` node reference, TSON types, scripting/templating syntax, layout patterns (app shells, page-containers, components), and the sharp edges that silently break output — the `<table>` orphan-relocation bug and Shadow DOM `:host` vs `html`/`body`/`:root` selectors chief among them.
---

# Building DRX apps

DRX apps are plain HTML files built from composable `<x-*>` nodes. No build step — one `<script src=".../drx.js">` tag compiles and runs the markup directly in the browser. State is reactive signals; rendering is fully declarative.

## Read this first

| File | Read it when |
| --- | --- |
| [reference.md](reference.md) | You need a node's exact attributes, or its scripting/templating/TSON syntax. |
| [gotchas.md](gotchas.md) | **Always, before writing anything.** These are narrow-bridge facts — get them wrong and the app silently renders broken or blank instead of erroring. |
| [patterns.md](patterns.md) | You're structuring a new app (shell layout, reusable widgets, avoiding duplicated content across pages). |
| [migration.md](migration.md) | The task is porting an existing HTML/CSS/JS file or site into DRX. Follow it step by step — don't freelance the workflow. |

## Minimal app

```html
<script src="https://cdn.jsdelivr.net/npm/@vorplex/drx@latest/dist/standalone/drx.js"></script>
<x-app>
  <x-page name="home">
    <x-variable name="count">0</x-variable>
    <button onclick="count(count() + 1)">Clicked {{count()}} times</button>
  </x-page>
</x-app>
```

Exactly one `<x-app>` per app. `<x-app>` itself can also hold template content directly (element children, `<x-route>`, `<x-page-container>`) — that's the app shell / composition root, not just a bag of declarations. See [patterns.md](patterns.md) for when to use that.

## Non-negotiable rules

These are the facts that produce a silently-broken app (not a loud error) when violated. Full explanations and the *why* behind each are in [gotchas.md](gotchas.md) — read it before generating markup, don't rely on this condensed list alone.

1. **Every declaration (`<x-page>`, `<x-variable>`, `<x-component>`, `<x-asset>`, `<x-api>`, `<x-type>`, `<x-service>`, `<x-packages>`) is a direct child of `<x-app>`** — never a sibling written after `</x-app>` closes. A page/etc. placed outside `<x-app>` is never discovered: no parse error, just every reference to it silently failing to resolve.
2. **Never** put `<x-if>`/`<x-for>`/`<x-import>` directly inside `<table>`/`<tbody>`/`<tr>` — the browser's HTML parser relocates them out of the row, silently breaking the layout. Build grids with `<div style="display:grid">` instead.
3. Every `<x-page>`/`<x-component>`/`<x-component-instance>` mounts into its **own Shadow DOM**. A `<style>` block scoped to one of them must use `:host` to style the root element itself — `html`, `body`, `:root` selectors never match inside a shadow root. Put true global CSS (resets, fonts) in the `<style>` directly under `<x-app>` instead.
4. Never reach for `document.querySelector`, `.innerHTML =`, `addEventListener`, or DOM cloning from a script — shadow encapsulation means these silently find nothing. All rendering is declarative: `<x-variable>` + `{{ }}` + `<x-if>` + `<x-for>`. `drx.page.root`/`drx.component.root` (the shadow root itself) is the one sanctioned escape hatch, last resort only — see [gotchas.md](gotchas.md).
5. A signal is always called: `count()` reads, `count(value)` writes. Never `count = value`, never read one without `()`.
6. `<x-variable>`'s body is **strict JSON** (parsed with `JSON.parse`) — no trailing commas, no unquoted keys, no JS expressions.
7. `<x-component>` is **fully isolated** — no access to app/page variables, assets, APIs, or an enclosing component's declarations, even nested arbitrarily deep. Everything it needs must be redeclared inside it.
8. Reserved names that silently shadow built-ins: variable names `asset`/`modal` at app/page scope (and `asset` inside a component); component prop/event names `id`/`component`/`asset`.
9. At most one `<script type="application/typescript">` and one `<style>` per app/page/component/service — extras are ignored, not merged or erroring.
10. `<x-route>` is placed directly in a template (app-level or nested) — there is no `<x-router>` wrapper element. Matching is **prefix/partial** by default: `/` matches everything, `/posts` stays matched under `/posts/42`. Check `router.route() === '/exact/path'` when a route must not match beneath itself.
11. A `<x-page-container>`'s embedded page fully remounts when its `page` expression changes — page-scoped state doesn't survive the swap. State that must persist across a page switch belongs in an app-level `<x-variable>` instead.

## Scripting shape

Every app/page/component/service script: `export default DRX.defineApp/definePage/defineComponent/defineService(drx => class { onMount() {...} onUnmount() {...} ... })`, inline in `<script type="application/typescript">` or as an imported `.ts` file with the same `export default`.

- `drx.page.variables.<n>.get()/set(v)/reset()/validate()` (same shape for `drx.app.variables.<n>`, `drx.component.variables.<n>`). A page can also reach `drx.app.instance.<method>()` — pages inherit the app, components don't inherit anything.
- `drx.page.root`/`drx.component.root` exposes the page's/component's own shadow root — last-resort escape hatch when nothing declarative can express it. See [gotchas.md](gotchas.md#no-imperative-dom-access).
- Event handler attributes (`onclick`, etc.) are plain calls resolved against the script's methods or a signal — **not** `{{ }}` expressions, and not reactively tracked; they run once per event.
- `{{ }}` interpolates in text and any element/`<x-icon>` attribute. `class.<name>` toggles a class by truthiness. `style.<property>` sets one inline style property.

## Workflow

**New app:** skim [patterns.md](patterns.md) for the shape (shell? plain pages? router-driven?), then write markup, pulling exact attributes from [reference.md](reference.md) as needed. Self-check against the rules above and [gotchas.md](gotchas.md) before calling it done.

**Migrating existing HTML:** follow [migration.md](migration.md)'s workflow exactly — it has its own checklist and ordering, don't skip steps.

## If something looks like a DRX bug, not a mistake in the generated markup

Stop and report it — name the file, the exact markup, and what broke — rather than working around it or guessing at a fix. These skill files describe the framework as implemented; if real behavior contradicts them, that's either a doc gap worth fixing here, or a genuine bug worth fixing in `packages/vorplex/drx`. Don't silently paper over either.
