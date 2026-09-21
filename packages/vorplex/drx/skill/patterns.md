# DRX patterns and best practices

## Contents

- [Decision guide: page vs page-container vs component](#decision-guide-page-vs-page-container-vs-component)
- [Shell architecture: nav + content area](#shell-architecture-nav--content-area)
- [Pages as page parts, composed with page-containers](#pages-as-page-parts-composed-with-page-containers)
- [Components for isolated, reused widgets](#components-for-isolated-reused-widgets)
- [Router-driven shells](#router-driven-shells)
- [List + row-component](#list--row-component)

## Decision guide: page vs page-container vs component

| Need | Use | Why |
| --- | --- | --- |
| A distinct screen/route destination | `<x-page>` | Targetable by `<x-route>`, `drx.pages.<n>.show()`, or `showModal()` |
| A shared layout piece (header, sidebar, footer) that reads app state, or a page split into swappable parts | `<x-page>` + `<x-page-container>` | Shares full app context — no prop/event plumbing needed |
| A self-contained, reusable widget (card, rating control, tag input, a piece of UI reused across unrelated pages) | `<x-component>` | Total isolation forces an explicit, small prop/event contract — safe to drop anywhere |

Default to `<x-page-container>` first for anything that's really "a piece of this one app's layout." Reach for `<x-component>` only once something is genuinely a reusable, isolated unit — wrapping every `<div>` in a component adds prop/event plumbing for no isolation benefit.

## Shell architecture: nav + content area

For an app with a persistent left nav (or header/sidebar) and a content area that swaps per route, put the shell in `<x-app>`'s own template — it's the entry point, and it mounts once, before any page. The content slot is a `<x-page-container>` whose `page` reacts to the route or to app-level state.

```html
<x-app>
  <x-variable name="activePage">"dashboard"</x-variable>

  <style>
    :host { display: grid; grid-template-columns: 240px 1fr; height: 100vh; }
  </style>

  <nav>
    <button onclick="activePage('dashboard')" class.active="{{activePage() === 'dashboard'}}">Dashboard</button>
    <button onclick="activePage('settings')" class.active="{{activePage() === 'settings'}}">Settings</button>
  </nav>

  <main>
    <x-page-container page="{{activePage()}}"></x-page-container>
  </main>

  <x-page name="dashboard">...</x-page>
  <x-page name="settings">...</x-page>
</x-app>
```

Remember: `<x-app>`'s own `<style>` adopts onto the real document, not a shadow root — see [gotchas.md](gotchas.md#shadow-dom-host-vs-htmlbodyroot) for the exact `:host` rule when the shell's layout instead lives inside a wrapping `<x-page>`.

If routing (deep-linkable URLs, browser back/forward) matters, drive the same slot from `<x-route>` instead of a plain variable — see [Router-driven shells](#router-driven-shells).

## Pages as page parts, composed with page-containers

When several pages share a header, footer, or sidebar, don't repeat that markup in every `<x-page>`. Extract the shared piece into its own `<x-page>` (even though it's never routed to directly) and embed it with `<x-page-container>`:

```html
<x-page name="app-header">
  <header>
    <img src="{{asset.logo}}" />
    <span>{{title()}}</span>
  </header>
</x-page>

<x-page name="dashboard">
  <x-page-container page="app-header"></x-page-container>
  <section class="content">...</section>
</x-page>

<x-page name="settings">
  <x-page-container page="app-header"></x-page-container>
  <section class="content">...</section>
</x-page>
```

Because `<x-page-container>` shares the embedding page's app context, `app-header` can freely read app-level variables (`title` above) without any prop wiring — this is the main advantage over a component for shared layout parts.

## Components for isolated, reused widgets

Reach for `<x-component>` when a piece of UI is reused across genuinely different contexts and should carry no assumptions about what's around it — a todo row, a confirm-dialog body, a rating widget. Give it the smallest prop/event surface that lets every call site drive it:

```html
<x-component name="rating">
  <x-property name="value" type="number"></x-property>
  <x-property name="max" type="number"></x-property>
  <x-event name="changed" type="number"></x-event>

  <div class="rating">
    <x-for each="{{Array.from({length: max()}, (_, i) => i + 1)}}" as="star">
      <button
        onclick="drx.component.events.changed.emit(star())"
        class.filled="{{star() <= value()}}"
      >★</button>
    </x-for>
  </div>
</x-component>
```

Because isolation is total (see [gotchas.md](gotchas.md#component-isolation-is-total)), a component can never accidentally couple to the page it happens to be dropped into — that's the point, not a limitation to work around.

## Router-driven shells

Combine the shell pattern with `<x-route>` for deep-linkable URLs instead of a plain variable driving the content slot:

```html
<x-app>
  <nav>
    <a href="#/dashboard" class.active="{{router.active('/dashboard')}}">Dashboard</a>
    <a href="#/settings" class.active="{{router.active('/settings')}}">Settings</a>
  </nav>
  <main>
    <x-route route="/dashboard"><x-page-container page="dashboard"></x-page-container></x-route>
    <x-route route="/settings"><x-page-container page="settings"></x-page-container></x-route>
  </main>
</x-app>
```

`router.active(path)` uses the same partial matching as route dispatch, so a nav link stays highlighted anywhere under its section, not just on its exact path.

## List + row-component

The default shape for a page backed by a list: state as a page/app `<x-variable>`, one `<x-for>` over it, row rendering delegated to an isolated `<x-component>` wired through props/events. This keeps the list page's script about data (fetch, filter, mutate) and the row component's script about presentation:

```html
<x-page name="todos">
  <x-variable name="items" type="array">[]</x-variable>

  <script type="application/typescript">
    export default DRX.definePage(drx => class {
        onRemoved(itemId: number) {
            drx.page.variables.items.set(drx.page.variables.items.get().filter(t => t.id !== itemId));
        }
    });
  </script>

  <x-for each="{{items()}}" as="item" track="id">
    <x-component-instance
      component="todo-row"
      itemId="{{item.id()}}"
      title="{{item.title()}}"
      removed="onRemoved(event)"
    ></x-component-instance>
  </x-for>
</x-page>
```

`id` is reserved on `<x-property>`/`<x-event>` (see [gotchas.md](gotchas.md#reserved-names)) — a component that needs to pass its own identity through as a prop must name it something else, like `itemId` above, never `id`.
