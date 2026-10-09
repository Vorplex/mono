import { DrxDom } from '../src/dom';
import { DRX } from '../src/drx';

async function bootstrap() {
    const source = document.body.innerHTML;
    const base = new URL('.', document.baseURI).href;
    await DrxDom.bootstrap(document.body, async () => {
        const drxDocument = await DRX.load(source, {
            import: (path) => fetch(base + path).then((response) => response.text()),
        });
        await drxDocument.render(document.body);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
