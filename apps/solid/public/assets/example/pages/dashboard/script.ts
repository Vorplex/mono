import { noop } from 'lodash';

export default Shtml.definePage(shtml => class {
    onMount() {
        shtml.app.instance.loadPosts();
        // Each script is evaluated in its own fresh module realization (see shtml/plan.md's open problem), so this
        // is expected to log `false` — the app script's `noop` and this page's `noop` are not the same reference.
        const identical = shtml.app.instance.getLodashNoop() === noop;
        console.log(`CROSS SCRIPT MODULE IDENTITY: ${identical}`);
    }
    async previewNotFound() {
        const result = await shtml.pages['404'].showModal();
        console.log(`MODAL CLOSED WITH ${result}`);
    }
});
