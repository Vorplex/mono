import { Scope, Signal } from '@vorplex/core';

interface ModalFrame {
    data: any;
    host: HTMLDialogElement;
    root: Scope;
    resolve: (result: any) => void;
    result: any;
}

const MODAL_CLASS = 'x-modal';

// Native, vanilla-DOM. Each modal is its own <dialog>, shown via showModal() -- the browser's top layer
// guarantees it renders above everything else (no z-index arms race), and focus trapping / inert-ing the rest
// of the page come for free. Reset to full-bleed and transparent, and the native ::backdrop neutralized below,
// so backdrop, centering, and sizing stay the mounted page's own styling responsibility, not the framework's.
const stack: ModalFrame[] = [];

let backdropStyleInjected = false;
function ensureBackdropStyle(): void {
    if (backdropStyleInjected) return;
    backdropStyleInjected = true;
    const style = document.createElement('style');
    style.textContent = `.${MODAL_CLASS}::backdrop { background: transparent; }`;
    document.head.appendChild(style);
}

export const ModalManager = {
    // Mounts `mount(container)` (a page) inside a fresh Signal.root -- independent of the caller's own scope,
    // since a modal must outlive whatever effect/handler triggered it. Resolves when `close(result)` is called,
    // or with `undefined` if the user dismisses it natively (Escape) -- both funnel through the dialog's own
    // `close` event, so there's exactly one teardown path regardless of how it closed.
    open(mount: (container: Node) => void, options: { data?: any } = {}): Promise<any> {
        return new Promise(resolve => {
            ensureBackdropStyle();
            const host = document.createElement('dialog');
            host.className = MODAL_CLASS;
            host.style.cssText = 'position: fixed; inset: 0; margin: 0; padding: 0; border: none; width: 100%; height: 100%; max-width: none; max-height: none; background: transparent;';
            document.body.appendChild(host);
            // Pushed before mount() runs: mount() synchronously fires the mounted page's onMount() -- so if
            // onMount() reads shtml.modal.data, the frame must already be on the stack.
            const frame: ModalFrame = { data: options.data, host, root: undefined as unknown as Scope, resolve, result: undefined };
            stack.push(frame);
            host.addEventListener('close', () => {
                stack.pop();
                frame.root.dispose();
                frame.host.remove();
                frame.resolve(frame.result);
            }, { once: true });
            frame.root = Signal.root(() => mount(host));
            host.showModal();
        });
    },
    get data(): any {
        return stack.at(-1)?.data;
    },
    close(result?: any): void {
        const frame = stack.at(-1);
        if (!frame) return;
        frame.result = result;
        frame.host.close();
    }
};

// The exact `modal` shape exposed everywhere -- `shtml.modal` in app/page scripts, and the `modal` template
// local in page markup. One shared object instead of re-declaring the same two members per call site.
export const modalApi = {
    get data() { return ModalManager.data; },
    close: (result?: any) => ModalManager.close(result)
};
