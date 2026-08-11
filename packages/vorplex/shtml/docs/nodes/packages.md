# `<x-packages>`

Declares the npm package versions available to scripts on the enclosing [`<x-app>`](app.md) or [`<x-component>`](component.md).

## Syntax

```html
<x-packages>{ "lodash": "^4.17.21" }</x-packages>
```

## Attributes

None.

## Body

A JSON object mapping package name to semver range — the same "one element, JSON body" convention as [`<x-type>`](type.md)/[`<x-variable>`](variable.md).

## Behavior

At most one per `<x-app>` or `<x-component>`. A script's bare npm imports (e.g. `import { upperCase } from 'lodash'`) can only resolve to a version declared here — scripts have no other way to pin what a bare import means. Scoping follows the same rule as [`<x-api>`](api.md)/[`<x-service>`](service.md)/[`<x-asset>`](asset.md): a component's `<x-packages>` only affects that component's own scripts, never inherited from the app or from an enclosing component.
