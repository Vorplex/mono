export default DRX.defineComponent(drx => class {
    dismiss() {
        console.log(`BADGE TEXT ${drx.component.props.text()}`);
        drx.component.events.dismissed.emit('dismissed');
    }
});
