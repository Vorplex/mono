import type { DrxDocumentState } from '../src/drx';
import { IconSheet } from '../src/icon-sheet';
import { DrxApp } from '../src/node/app';

async function run() {
    try {
        IconSheet.load('icons.svg');
        const [state, bundle]: [DrxDocumentState, string] = await Promise.all([
            fetch('app.json').then(response => response.json()),
            fetch('bundle.js').then(response => response.text())
        ]);
        DrxApp.mount(document.body, state.app, state, bundle);
        if (state.app.pwaMetadata && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('pwa-service-worker.js', { updateViaCache: 'none' })
                .then(registration => {
                    registration.active?.postMessage({ type: 'SYNC_CACHE' });
                    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
                })
                .catch(() => { });
        }
    } catch (error) {
        console.error(error);
        document.body.replaceChildren();
        const pre = document.createElement('pre');
        pre.style.cssText = 'white-space: pre-wrap; color: #b00020; font: 13px/1.5 ui-monospace, monospace; padding: 16px; margin: 0;';
        pre.textContent = Error.isError(error) ? error.stack ?? error.message : String(error);
        document.body.appendChild(pre);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
} else {
    run();
}
