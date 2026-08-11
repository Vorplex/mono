# Modals

Any declared [`<x-page>`](../nodes/page.md) can be mounted as a modal from a page script:

```ts
const result = await shtml.pages["confirm-action"].showModal({
    data: { caseId: "AFASA-2026-001245" }
});
```

`showModal(options?)` accepts `{ data?: any }` and returns a `Promise<any>`. The promise resolves with the value passed to `modal.close(result)`.

## Modal page

The mounted page receives the top-most modal frame through both its script and template:

```html
<x-page name="confirm-action">
    <script type="application/typescript">
        export default Shtml.definePage(shtml => class {
            onMount() {
                console.log(shtml.modal.data.caseId);
            }

            confirm() {
                shtml.modal.close({ confirmed: true });
            }
        });
    </script>

    <div class="modal-overlay">
        <div class="modal-backdrop" onclick="modal.close('cancelled')"></div>
        <section class="modal-card">
            <p>{{modal.data.caseId}}</p>
            <button onclick="modal.close('cancelled')">Cancel</button>
            <button onclick="confirm()">Confirm</button>
        </section>
    </div>
</x-page>
```

- `shtml.modal.data` in the script and `modal.data` in the template are the payload passed through `options.data`.
- Data is installed before the modal page mounts, so it is available in `onMount()`.
- `shtml.modal.close(result)` and `modal.close(result)` close the top-most modal and resolve its `showModal()` promise.
- Modal pages use the normal page lifecycle and app context. Closing disposes the page scope, calls `onUnmount()`, and removes its host.
- Nested modals form a stack; `modal.data` and `modal.close()` always address the top-most frame.

## Layout responsibility

The framework appends a native `<dialog>` host to `document.body` and opens it via `showModal()` -- the browser's top layer, so it renders above everything else with no z-index needed, and focus trapping / inert-ing the rest of the page come for free. The host itself is reset to full-bleed and transparent (its native `::backdrop` is neutralized too), so the modal page must still provide its own backdrop, centering, and sizing:

```css
.modal-overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 20px;
}

.modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgb(0 0 0 / 45%);
}

.modal-card {
    position: relative;
    width: min(720px, calc(100vw - 40px));
    max-height: calc(100vh - 40px);
    overflow: auto;
}
```

`shtml.pages.<name>.show()` is unrelated to modals: it selects the current page only in an app without a router and throws when a router owns page selection.
