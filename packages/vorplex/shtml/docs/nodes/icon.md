# `<x-icon>`

Renders a named icon from the app's [`<x-icons>`](icons.md) sprite sheet.

## Syntax

```html
<x-icon name="chevron-down"></x-icon>
<x-icon name="{{expanded() ? 'chevron-up' : 'chevron-down'}}"></x-icon>
<x-icon name="user" class="nav-icon" style.width="20px"></x-icon>
```

## Attributes

- `name` (Required) — the icon's name in the sheet (e.g. a [Lucide](https://lucide.dev) icon name like `chevron-down`, if no [`<x-icons>`](icons.md) overrides the default sheet). It can be an expression that swaps the icon at runtime.
- Any other attribute — bound onto the rendered `<svg>` exactly like on an ordinary element (`class`, `class.<name>`, `style.<property>`, event handlers, etc. — see [Templating](../concepts/templating.md)). Every `<x-icon>` attribute supports expressions. There's no separate sizing/color API: an icon's fill/stroke otherwise just follows whatever the loaded sheet's own `<symbol>` declares (typically `stroke="currentColor"` for Lucide, so it inherits the surrounding text color by default).

## Behavior

Mounts as `<svg>` containing a direct clone of the matched icon's own content (its `viewBox` copied onto the wrapper too, so the artwork scales correctly) — not a `<use>` referencing a shared `<symbol>` elsewhere. See [`<x-icons>`](icons.md) for why: pages/components each render into their own shadow root, and a `<use href="#name">` can't resolve across that boundary. If `name` doesn't match anything in the loaded sheet, nothing renders (no error) — same as referencing a CSS class that doesn't exist.
