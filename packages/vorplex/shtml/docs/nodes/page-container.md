# `<x-page-container>`

Renders another page inline, as a layout slot within the current page.

## Syntax

```html
<x-page-container page="{{selectedPage()}}"></x-page-container>
```

## Attributes

- `page` (type: [expression](../concepts/expression.md)) — the `name` of the [`<x-page>`](page.md) to render. It reacts when its signal dependencies change.

## Behavior

Lets one page embed another — for example, a `shell` page embedding a `header` page as a shared layout piece. The referenced page renders with the same context-sharing rules described in [Context & Isolation](../concepts/context-and-isolation.md): it isn't sandboxed the way an [`<x-component-instance>`](component-instance.md) is.

Referencing by a `page` attribute (rather than a dedicated tag per page) keeps page instantiation consistent with [`<x-component-instance>`](component-instance.md). Use one reactive container to switch a layout slot; separate conditional containers are unnecessary:

```html
<x-page-container page="{{selectedPage()}}"></x-page-container>
```
