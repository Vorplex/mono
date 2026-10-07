import { Signal } from '@vorplex/core';
import type { DrxDocumentState } from '../src/document';
import { DrxDom } from '../src/dom';
import { DrxIconSheet } from '../src/icon-sheet';
import { DrxRenderer } from '../src/renderer';

export async function bootstrap(paths: { bundle: string, state: string, icons: string }) {
    await DrxDom.bootstrap(document.body, async () => {
        DrxIconSheet.load(paths.icons);
        const [state, bundle]: [DrxDocumentState, string] = await Promise.all([
            fetch(paths.state).then(response => response.json()),
            fetch(paths.bundle).then(response => response.text())
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
        return new DrxRenderer(Signal.create(state), { bundle }).render(document.body);
    });
}
