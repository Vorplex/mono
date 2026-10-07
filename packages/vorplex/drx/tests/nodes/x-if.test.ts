import { test } from '../fixtures/drx';

test.describe('<x-if>', () => {
    test('renders the first matching branch of if, else-if and else', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="on" type="boolean"></x-variable>
                <button id="toggle" onclick="on(value => !value)">Toggle</button>
                <x-if condition="on()">
                    <p id="on">On</p>
                    <x-else-if condition="on() === false">
                        <p id="off">Off</p>
                    </x-else-if>
                    <x-else>
                        <p id="unset">Unset</p>
                    </x-else>
                </x-if>
            </x-app>
        `);
        const toggle = drx.node('toggle');
        const on = drx.node('on');
        const off = drx.node('off');
        const unset = drx.node('unset');
        {
            await on.expect.not.toBeAttached();
            await off.expect.not.toBeAttached();
            await unset.expect.toBeVisible();
        }
        await toggle.click();
        {
            await on.expect.toBeVisible();
            await off.expect.not.toBeAttached();
            await unset.expect.not.toBeAttached();
        }
        await toggle.click();
        {
            await on.expect.not.toBeAttached();
            await off.expect.toBeVisible();
            await unset.expect.not.toBeAttached();
        }
    });

    test('does not mount content when the condition is false', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <p id="visible">Visible</p>
                <x-if condition="false">
                    <p id="hidden">Hidden</p>
                </x-if>
            </x-app>
        `);
        const visible = drx.node('visible');
        const hidden = drx.node('hidden');
        {
            await visible.expect.toBeVisible();
            await hidden.expect.not.toBeAttached();
        }
    });

    test('only renders the first true else-if', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-if condition="false">
                    <p id="if">If</p>
                    <x-else-if condition="true">
                        <p id="first">First</p>
                    </x-else-if>
                    <x-else-if condition="true">
                        <p id="second">Second</p>
                    </x-else-if>
                    <x-else>
                        <p id="else">Else</p>
                    </x-else>
                </x-if>
            </x-app>
        `);
        const ifBranch = drx.node('if');
        const first = drx.node('first');
        const second = drx.node('second');
        const elseBranch = drx.node('else');
        {
            await ifBranch.expect.not.toBeAttached();
            await first.expect.toBeVisible();
            await second.expect.not.toBeAttached();
            await elseBranch.expect.not.toBeAttached();
        }
    });
});
