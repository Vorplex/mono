import { DRX } from '../src/drx';
import { DrxDom } from '../src/dom';
import { DrxRenderer } from '../src/renderer';
import { DrxBundler } from '../src/bundler';

async function bootstrap() {
    const source = document.body.innerHTML;
    const base = new URL('.', document.baseURI).href;
    await DrxDom.bootstrap(document.body, async () => {
        const drxDocument = await DRX.load(source, {
            import: (path) => fetch(base + path).then((response) => response.text()),
        });
        const bundle = await DrxBundler.bundle(drxDocument.state.value);
        return new DrxRenderer(drxDocument.state.signal, { bundle }).render(document.body);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
