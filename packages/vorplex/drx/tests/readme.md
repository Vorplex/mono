# DRX tests

Playwright tests that render real DRX markup in Chromium and assert what the user sees. The [DRX docs](../../../../docs/drx) are the source of truth: every test checks a behaviour the docs describe, and `tests/nodes/<node>.test.ts` covers the page `docs/drx/nodes/<node>.md`.

## Running

```sh
pnpm --filter @vorplex/drx test:e2e
npx playwright test tests/nodes/x-route.test.ts
npx playwright test --ui
```

Playwright starts `standalone/serve.mts`, so tests run the current source, not a published build. Name test files `*.test.ts` — `*.spec.ts` belongs to vitest.

## The `drx` fixture

Import `test` and `expect` from `fixtures/drx`, never from `@playwright/test`.

| Member | Use |
| --- | --- |
| `drx.render(markup, { hash?, files? })` | Renders DRX markup. The `drx.js` script is added for you — pass only the `<x-app>`, no `<html>`, `<head>` or `<body>` unless the test is about them. `hash` sets the initial route, `files` serves files for `<x-import>`. |
| `drx.node(id)` | Locator for `#id`, with `.expect` for assertions: `title.expect.toHaveText('Home')`. Reaches inside shadow roots. |
| `drx.navigate(hash)` | Changes `location.hash`. |
| `drx.logged(text)` | Waits until the page has logged `text` with `console.log`. |
| `drx.logs`, `drx.errors` | Everything logged so far, and console errors plus uncaught exceptions. |

The fixture also serves the icon sprite and the esbuild wasm locally, so tests don't depend on a CDN. Mock any other request with `page.route`.

## Shape of a test

```ts
test('exact only matches when nothing is left over', async ({ drx }) => {
    await drx.render(`
        <x-app>
            <x-route route="/" exact>
                <p id="home">Home</p>
            </x-route>
            <x-route route="/">
                <p id="any">Any</p>
            </x-route>
        </x-app>
    `, { hash: '#/notes' });
    const home = drx.node('home');
    const any = drx.node('any');
    {
        await home.expect.not.toBeAttached();
        await any.expect.toBeVisible();
    }
    await drx.navigate('#/');
    {
        await home.expect.toBeVisible();
        await any.expect.toBeVisible();
    }
});
```

1. **Render.** Every element that contains other elements gets its own line. Leaf elements stay on one line: `<p id="home">Home</p>`.
2. **Hoist nodes.** Right after render, declare a const for every node the test touches, in the order they appear in the markup. Name it after its id in camelCase.
3. **One `{ }` block per state.** After render and after every action (`click`, `fill`, `drx.navigate`, …), a block asserts the complete expected state, in markup order. Include nodes that should not have changed — `any` still rendering is as much a part of the behaviour as `home` appearing.

## Writing assertions

- **Readable first.** A test is documentation of DRX behaviour. Prefer meaningful ids, text and values over anything clever.
- **Target by `id`** through `drx.node`, not by role or text.
- **Say exactly what you mean:**
  - `not.toBeAttached()` — not mounted at all (the `x-if` and route cases). `not.toBeVisible()` would also pass for hidden content.
  - `toBeVisible()` — rendered and shown.
  - `toHaveCount(n)` — only when the number itself is the point, such as list items.
  - `toHaveJSProperty('textContent', …)` — exact text including spaces; `toHaveText` normalizes whitespace.
- **One assertion per fact.** Don't bundle several checks into one `toEqual({ ... })` object.
- **Logs and requests are state too.** Put `await drx.logged(...)` and request checks inside the block for the state they belong to.

## DRX markup gotchas

- **`id` on an `x-*` node is the DRX node id.** It is not passed through to the rendered element, so wrap the node to target it: `<span id="host"><x-icon name="..."></x-icon></span>`.
- **Keep HTML out of text and `<x-variable>` content.** The browser parses markup before DRX does, so a literal `<b>` there becomes a real element. Only a test that is about HTML-as-text needs it, and then escapes it: `{{'&lt;b&gt;bold&lt;/b&gt;'}}`.
- **Line breaks between elements are dropped, spaces on the same line are kept.** Splitting elements onto their own lines is safe, except in tests about inline whitespace.
- **`${…}` in markup belongs to the test.** It is evaluated before DRX sees the markup, which is useful for sharing a snippet such as `${types}`. For a template literal inside a DRX script, escape it as `\${`.
