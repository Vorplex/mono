import { DrxDocument, type DrxDocumentState } from '../src/drx';
import { IconSheet } from '../src/icon-sheet';
import { DrxApp } from '../src/node/app';

async function run() {
    await DrxDocument.bootstrap(document.body, async () => {
        IconSheet.load('icons.svg');
        const [state, bundle]: [DrxDocumentState, string] = await Promise.all([
            fetch('app.json').then(response => response.json()),
            fetch('bundle.js').then(response => response.text())
        ]);
        if (state.app.pwaMetadata && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('pwa-service-worker.js', { updateViaCache: 'none' })
                .then(registration => {
                    registration.active?.postMessage({ type: 'SYNC_CACHE' });
                    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
                })
                .catch(() => { });
        }
        return DrxApp.mount(document.body, state.app, state, bundle);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
} else {
    run();
}
