import { test } from '../fixtures/drx';

test.describe('<x-property>', () => {
    test('is a callable signal in the component template', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <x-property name="level" type="string"></x-property>
                    <div id="alert" class="alert" class.critical="level() === 'error'">{{level()}}</div>
                </x-component>
                <x-component-instance component="alert" level="error"></x-component-instance>
            </x-app>
        `);
        const alert = drx.node('alert');
        {
            await alert.expect.toHaveText('error');
            await alert.expect.toHaveClass('alert critical');
        }
    });

    test('is undefined when the consumer does not pass it', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="greeting">
                    <x-property name="name" type="string"></x-property>
                    <x-property name="key" type="string"></x-property>
                    <p id="{{key()}}">Hello {{name() ?? 'stranger'}}</p>
                </x-component>
                <x-component-instance component="greeting" key="named" name="Ada"></x-component-instance>
                <x-component-instance component="greeting" key="anonymous"></x-component-instance>
            </x-app>
        `);
        const named = drx.node('named');
        const anonymous = drx.node('anonymous');
        {
            await named.expect.toHaveText('Hello Ada');
            await anonymous.expect.toHaveText('Hello stranger');
        }
    });

    test('is read through drx.component.props in the component script', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <x-property name="text" type="string"></x-property>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            log() { console.log('prop ' + drx.component.props.text()); }
                        });
                    </script>
                    <button id="log" onclick="log()">Log text</button>
                </x-component>
                <x-component-instance component="alert" text="Disk space low"></x-component-instance>
            </x-app>
        `);
        const log = drx.node('log');
        await log.click();
        {
            await drx.logged('prop Disk space low');
        }
    });

    test('updates when an interpolated source changes', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="count" type="number">1</x-variable>
                <x-component name="display">
                    <x-property name="value" type="number"></x-property>
                    <p id="value">{{value()}}</p>
                </x-component>
                <x-component-instance component="display" value="{{count()}}"></x-component-instance>
                <button id="increment" onclick="count(value => value + 1)">Increment</button>
            </x-app>
        `);
        const value = drx.node('value');
        const increment = drx.node('increment');
        {
            await value.expect.toHaveText('1');
        }
        await increment.click();
        {
            await value.expect.toHaveText('2');
        }
    });

    test('ranks above component variables with the same name', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="probe">
                    <x-variable name="label" type="string">"variable"</x-variable>
                    <x-property name="label" type="string"></x-property>
                    <p id="label">{{label()}}</p>
                </x-component>
                <x-component-instance component="probe" label="property"></x-component-instance>
            </x-app>
        `);
        const label = drx.node('label');
        {
            await label.expect.toHaveText('property');
        }
    });
});
