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
| `<x-api url>`                                                                 | Interpolation or literal text | `<x-api name="todos" url="{{settings.api.url}}"></x-api>`                                                                                |
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