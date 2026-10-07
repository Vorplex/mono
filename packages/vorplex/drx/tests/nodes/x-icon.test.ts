import { expect, test } from '../fixtures/drx';

test.describe('<x-icon>', () => {
    test('mounts as an svg resolved from the built-in icon set', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <span id="host">
                    <x-icon name="chevron-down"></x-icon>
                </span>
            </x-app>
        `);
        const chevronDown = drx.node('host').locator('svg path[data-icon="chevron-down"]');
        {
            await expect(chevronDown).toBeAttached();
        }
    });

    test('name is interpolated and reactive', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="expanded" type="boolean">false</x-variable>
                <span id="host">
                    <x-icon name="{{expanded() ? 'chevron-up' : 'chevron-down'}}"></x-icon>
                </span>
                <button id="toggle" onclick="expanded(value => !value)">Toggle</button>
            </x-app>
        `);
        const host = drx.node('host');
        const chevronUp = host.locator('svg path[data-icon="chevron-up"]');
        const chevronDown = host.locator('svg path[data-icon="chevron-down"]');
        const toggle = drx.node('toggle');
        {
            await expect(chevronUp).not.toBeAttached();
            await expect(chevronDown).toBeAttached();
        }
        await toggle.click();
        {
            await expect(chevronUp).toBeAttached();
            await expect(chevronDown).not.toBeAttached();
        }
    });

    test('binds other attributes to the svg', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="label" type="string">"Expand"</x-variable>
                <span id="host">
                    <x-icon name="chevron-down" class="icon" aria-label="{{label()}} section"></x-icon>
                </span>
                <button id="change" onclick="label('Collapse')">Change</button>
            </x-app>
        `);
        const icon = drx.node('host').locator('svg');
        const change = drx.node('change');
        {
            await expect(icon).toHaveClass('icon');
            await expect(icon).toHaveAttribute('aria-label', 'Expand section');
        }
        await change.click();
        {
            await expect(icon).toHaveClass('icon');
            await expect(icon).toHaveAttribute('aria-label', 'Collapse section');
        }
    });
});
