import { DrxDocument, type DrxSerializedDocument } from '../src/document';
import { DrxDom } from '../src/dom';
import { DrxIconSheet } from '../src/icon-sheet';
import { DrxRenderer } from '../src/renderer';

export async function bootstrap(paths: { bundle: string, documents: string, icons: string }) {
    await DrxDom.bootstrap(document.body, async () => {
        DrxIconSheet.load(paths.icons);
        const [serialized, bundle]: [DrxSerializedDocument, string] = await Promise.all([
            fetch(paths.documents).then(response => response.json()),
            fetch(paths.bundle).then(response => response.text())
        ]);
        const app = DrxDocument.deserialize(serialized);
        if (app.state.value.app.pwaMetadata && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('pwa-service-worker.js', { updateViaCache: 'none' })
                .then(registration => {
                    registration.active?.postMessage({ type: 'SYNC_CACHE' });
                    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
                })
                .catch(() => { });
        }
        return new DrxRenderer(app, { bundle }).render(document.body);
    });
}
