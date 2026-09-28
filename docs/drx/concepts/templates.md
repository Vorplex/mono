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
