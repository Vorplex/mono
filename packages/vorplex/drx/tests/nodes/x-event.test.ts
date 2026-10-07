import { expect, test } from '../fixtures/drx';

test.describe('<x-event>', () => {
    test('emits from the component script to the consumer handler', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <x-event name="dismissed" type="string"></x-event>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            dismiss() { drx.component.events.dismissed.emit('dismissed by user'); }
                        });
                    </script>
                    <button id="dismiss" onclick="dismiss()">Dismiss</button>
                </x-component>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onAlertDismissed(reason) { console.log('reason ' + reason); }
                    });
                </script>
                <x-component-instance component="alert" dismissed="onAlertDismissed(event)"></x-component-instance>
            </x-app>
        `);
        const dismiss = drx.node('dismiss');
        await dismiss.click();
        {
            await drx.logged('reason dismissed by user');
        }
    });

    test('is callable bare from the component template', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <x-event name="dismissed" type="string"></x-event>
                    <button id="dismiss" onclick="dismissed('from template')">Dismiss</button>
                </x-component>
                <x-component-instance component="alert" dismissed="console.log('event ' + event)"></x-component-instance>
            </x-app>
        `);
        const dismiss = drx.node('dismiss');
        await dismiss.click();
        {
            await drx.logged('event from template');
        }
    });

    test('payload is optional', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <x-event name="closed"></x-event>
                    <button id="close" onclick="closed()">Close</button>
                </x-component>
                <x-component-instance component="alert" closed="console.log('payload ' + typeof event)"></x-component-instance>
            </x-app>
        `);
        const close = drx.node('close');
        await close.click();
        {
            await drx.logged('payload undefined');
        }
    });

    test('emitting without a consumer handler does nothing', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <x-event name="dismissed" type="string"></x-event>
                    <button id="dismiss" onclick="dismissed('ignored'); console.log('emitted')">Dismiss</button>
                </x-component>
                <x-component-instance component="alert"></x-component-instance>
            </x-app>
        `);
        const dismiss = drx.node('dismiss');
        await dismiss.click();
        {
            await drx.logged('emitted');
            expect(drx.errors).toEqual([]);
        }
    });
});
