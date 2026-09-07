import { noop } from 'lodash';

export default DRX.definePage(drx => class {
    onMount() {
        drx.app.instance.loadPosts();
        // Each script is evaluated in its own fresh module realization (see drx/plan.md's open problem), so this
        // is expected to log `false` — the app script's `noop` and this page's `noop` are not the same reference.
        const identical = drx.app.instance.getLodashNoop() === noop;
        console.log(`CROSS SCRIPT MODULE IDENTITY: ${identical}`);
    }
    async previewNotFound() {
        const result = await drx.pages['404'].showModal();
        console.log(`MODAL CLOSED WITH ${result}`);
    }
});
