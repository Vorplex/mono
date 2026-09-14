import { DrxDocument } from '../src/drx';

async function bootstrap() {
    const source = document.body.innerHTML;
    const base = new URL('.', document.baseURI).href;
    await DrxDocument.bootstrap(document.body, async () => {
        const drxDocument = await DrxDocument.load(source, {
            import: (path) => fetch(base + path).then((response) => response.text()),
        });
        return await drxDocument.mount(document.body);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
