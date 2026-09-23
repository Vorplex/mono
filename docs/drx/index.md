# DRX

**DRX** (Declarative Reactive X) is a declarative `<x-*>` markup language that compiles to a reactive runtime with no build step — plain HTML files built from composable nodes like `<x-app>` and `<x-page>`, rendered directly in the browser by a single `<script>` tag.

## Quick Start

`<script src="https://cdn.jsdelivr.net/npm/@vorplex/drx@latest/dist/standalone/drx.js"></script>`

```html drx
<x-app>
  <x-variable name="count">0</x-variable>
  <button onclick="count(count() + 1)">
    Clicked {{count()}} times
  </button>
</x-app>
```

## Concepts

- [Locals](concepts/locals.md)

## Nodes

| Attribute Syntax  | Meaning                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **{ƒ} attribute** | The attribute supports text `Hello World!` or mixed text expressions `Fullname {{name()}} {{surname()}}` |
| **(ƒ) attribute** | The attribute is a pure expression `count() + 1`                                                         |
| attribute?        | The attribute is optional                                                                                |

- [\<x-app>](nodes/x-app.md)
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
- [\<x-dependency-tree>](nodes/x-dependency-tree.md)
- [\<x-pwa-metadata>](nodes/x-pwa-metadata.md)
- [\<x-api>](nodes/x-api.md)
- [\<x-route>](nodes/x-route.md)
- [\<x-if>](nodes/x-if.md)
- [\<x-for>](nodes/x-for.md)
- [\<x-icon>](nodes/x-icon.md)
