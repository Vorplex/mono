import { DrxDom } from '../src/dom';
import { DRX } from '../src/drx';

async function bootstrap() {
    const source = document.body.innerHTML;
    await DrxDom.bootstrap(document.body, async () => {
        const drxDocument = await DRX.load(source);
        await DRX.render(drxDocument, document.body);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
