export default Shtml.defineComponent(shtml => class {
    dismiss() {
        console.log(`BADGE TEXT ${shtml.component.props.text()}`);
        shtml.component.events.dismissed.emit('dismissed');
    }
});
