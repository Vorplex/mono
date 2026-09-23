import { type DrxDocumentState } from '../src/drx';
import { DrxDom } from '../src/drx-dom';
import { IconSheet } from '../src/icon-sheet';
import { DrxApp } from '../src/node/app/app';

export async function bootstrap(paths: { bundle: string, state: string, icons: string }) {
    await DrxDom.bootstrap(document.body, async () => {
        IconSheet.load(paths.icons);
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
        return DrxApp.mount(document.body, state.app, state, bundle);
    });
}
