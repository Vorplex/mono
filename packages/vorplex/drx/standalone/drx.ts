import { DrxDocument } from '../src/drx';

async function bootstrap() {
    try {
        const base = new URL('.', document.baseURI).href;
        const drxDocument = await DrxDocument.load(document.body.innerHTML, {
            import: (path) => fetch(base + path).then((response) => response.text()),
        });
        document.body.replaceChildren();
        await drxDocument.mount(document.body);
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
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
