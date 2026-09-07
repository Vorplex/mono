export default DRX.definePage(drx => class {
    constructor() {
        drx.app.variables.app.set({ name: 'App Name' });
        // drx.app.variables.app.get();
        // drx.app.variables.app.reset();
        // drx.app.variables.app.validate();
        const result = drx.app.instance.sum(1, 2);
    }
    onMount() {

    }
    onAlertClick(event: MouseEvent) {
        alert('Clicked!');
    }
    onBadgeDismissed(event: string) {
        console.log(`BADGE EVENT ${event}`);
    }
});