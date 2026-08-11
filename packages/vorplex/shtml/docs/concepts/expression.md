# Expression

An **expression** is a `{{ ... }}`-wrapped, JS-like expression evaluated against the current script/template scope. Expressions work in text, every HTML/SVG element attribute, every [`<x-icon>`](../nodes/icon.md) attribute, and four structural-node attributes: `x-for.each`, `x-if.condition`, `x-page-container.page`, and `x-component-instance.component`.

## Syntax

`{{ <expression> }}`. Inside the braces: signal reads (`count()`), comparisons and arithmetic (`count() >= 10`), literals (`['A', 'B', 'C']`), a loop entry's own per-property signal (`entry.label()` — see [`<x-for>`](../nodes/for.md)) — anything a plain JS expression can do.

## Reactivity

Reading a signal inside an expression subscribes that usage to it. Text and supported attributes are re-evaluated when a signal they read changes. See [Reactivity](reactivity.md).

## Where it's used

- Text interpolation.
- Every attribute on an HTML element, SVG element, or `<x-icon>`.
- `each` on `<x-for>` and `condition` on `<x-if>`.
- `page` on `<x-page-container>` and `component` on `<x-component-instance>`.

Other structural SHTML node attributes are literal.

## Not an expression

Event handler attributes are **not** `{{ }}`-wrapped — see [Templating](templating.md#event-handler-attributes).
