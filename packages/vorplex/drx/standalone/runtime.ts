import { DrxDocument, type DrxDocumentState } from '../src/document';
import { DrxDom } from '../src/dom';
import { DrxIconSheet } from '../src/icon-sheet';
import { DrxRenderer } from '../src/renderer';

export async function bootstrap(paths: { bundle: string, documents: string, icons: string, settings?: string }) {
    await DrxDom.bootstrap(document.body, async () => {
        DrxIconSheet.load(paths.icons);
        const [state, bundle, settings]: [DrxDocumentState, string, Record<string, any> | undefined] = await Promise.all([
            fetch(paths.documents).then(response => response.json()),
            fetch(paths.bundle).then(response => response.text()),
            paths.settings ? fetch(paths.settings).then(response => response.json()) : undefined
        ]);
        if (settings !== undefined) state.app.settings = { type: 'inline', value: settings };
        if (state.app.pwaMetadata && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('pwa-service-worker.js', { updateViaCache: 'none' })
                .then(registration => {
                    registration.active?.postMessage({ type: 'SYNC_CACHE' });
                    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
                })
                .catch(() => { });
        }
        return new DrxRenderer(new DrxDocument(state), { bundle }).render(document.body);
    });
}
