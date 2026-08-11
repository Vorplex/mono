export default Shtml.definePage(shtml => class {
    constructor() {
        shtml.app.variables.app.set({ name: 'App Name' });
        // shtml.app.variables.app.get();
        // shtml.app.variables.app.reset();
        // shtml.app.variables.app.validate();
        const result = shtml.app.instance.sum(1, 2);
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