import { expect, test } from '../fixtures/drx';

test.describe('<x-component-instance>', () => {
    test('instantiates a component by name with literal property attributes', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <x-property name="text" type="string"></x-property>
                    <div id="alert">{{text()}}</div>
                </x-component>
                <x-component-instance component="alert" text="Disk space low"></x-component-instance>
            </x-app>
        `);
        const alert = drx.node('alert');
        {
            await alert.expect.toHaveText('Disk space low');
        }
    });

    test('interpolated property attributes stay bound to the consumer locals', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="message" type="string">"First"</x-variable>
                <x-component name="alert">
                    <x-property name="text" type="string"></x-property>
                    <div id="alert">{{text()}}</div>
                </x-component>
                <x-component-instance component="alert" text="Message: {{message()}}"></x-component-instance>
                <button id="change" onclick="message('Second')">Change</button>
            </x-app>
        `);
        const alert = drx.node('alert');
        const change = drx.node('change');
        {
            await alert.expect.toHaveText('Message: First');
        }
        await change.click();
        {
            await alert.expect.toHaveText('Message: Second');
        }
    });

    test('component attribute can be interpolated to switch components', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="kind" type="string">"first"</x-variable>
                <x-component name="first">
                    <p id="first">First component</p>
                </x-component>
                <x-component name="second">
                    <p id="second">Second component</p>
                </x-component>
                <x-component-instance component="{{kind()}}"></x-component-instance>
                <button id="switch" onclick="kind('second')">Switch</button>
            </x-app>
        `);
        const first = drx.node('first');
        const second = drx.node('second');
        const switchKind = drx.node('switch');
        {
            await first.expect.toBeVisible();
            await second.expect.not.toBeAttached();
        }
        await switchKind.click();
        {
            await first.expect.not.toBeAttached();
            await second.expect.toBeVisible();
        }
    });

    test('event attributes run with the consumer locals and receive the payload as event', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="reason" type="string">"none"</x-variable>
                <x-component name="alert">
                    <x-event name="dismissed" type="string"></x-event>
                    <button id="dismiss" onclick="dismissed('dismissed by user')">Dismiss</button>
                </x-component>
                <x-component-instance component="alert" dismissed="reason(event)"></x-component-instance>
                <p id="reason">{{reason()}}</p>
            </x-app>
        `);
        const dismiss = drx.node('dismiss');
        const reason = drx.node('reason');
        {
            await reason.expect.toHaveText('none');
        }
        await dismiss.click();
        {
            await reason.expect.toHaveText('dismissed by user');
        }
    });

    test('starts a fresh locals list without anything from outside', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-variable name="items" type="array">["a", "b"]</x-variable>
                <x-component name="probe">
                    <x-property name="label" type="string"></x-property>
                    <p class="probe">{{label()}} {{typeof item}} {{typeof items}}</p>
                </x-component>
                <x-for each="items()" as="item">
                    <x-component-instance component="probe" label="{{item()}}"></x-component-instance>
                </x-for>
            </x-app>
        `);
        const probes = page.locator('.probe');
        {
            await expect(probes).toHaveText(['a undefined undefined', 'b undefined undefined']);
        }
    });
});
