import { expect, test } from '../fixtures/drx';

test.describe('element', () => {
    test('interpolated attributes remove on false, null and undefined and are empty on true', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="busy" type="boolean">false</x-variable>
                <button id="save" disabled="{{busy()}}" aria-busy="{{String(busy())}}" data-null="{{null}}" data-undefined="{{undefined}}" data-text="{{'false'}}" title="Saving {{busy()}}" onclick="busy(true)">Save</button>
            </x-app>
        `);
        const save = drx.node('save');
        {
            await save.expect.not.toHaveAttribute('disabled');
            await save.expect.toHaveAttribute('aria-busy', 'false');
            await save.expect.not.toHaveAttribute('data-null');
            await save.expect.not.toHaveAttribute('data-undefined');
            await save.expect.toHaveAttribute('data-text', 'false');
            await save.expect.toHaveAttribute('title', 'Saving false');
        }
        await save.click();
        {
            await save.expect.toHaveAttribute('disabled', '');
            await save.expect.toHaveAttribute('aria-busy', 'true');
            await save.expect.not.toHaveAttribute('data-null');
            await save.expect.not.toHaveAttribute('data-undefined');
            await save.expect.toHaveAttribute('data-text', 'false');
            await save.expect.toHaveAttribute('title', 'Saving true');
        }
    });

    test('form control attributes update the current state even after user edits', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="query" type="string">""</x-variable>
                <x-variable name="size" type="string">"m"</x-variable>
                <x-variable name="agreed" type="boolean">false</x-variable>
                <input id="query" value="{{query()}}" oninput="query(event.target.value)">
                <button id="clear" onclick="query('')">Clear</button>
                <select id="size" value="{{size()}}" onchange="size(event.target.value)">
                    <option value="s">Small</option>
                    <option value="m">Medium</option>
                    <option value="l">Large</option>
                </select>
                <button id="large" onclick="size('l')">Large</button>
                <input id="agreed" type="checkbox" checked="{{agreed()}}">
                <button id="agree" onclick="agreed(true)">Agree</button>
                <p id="state">{{query()}}/{{size()}}</p>
            </x-app>
        `);
        const query = drx.node('query');
        const clear = drx.node('clear');
        const size = drx.node('size');
        const large = drx.node('large');
        const agreed = drx.node('agreed');
        const agree = drx.node('agree');
        const state = drx.node('state');
        {
            await query.expect.toHaveValue('');
            await size.expect.toHaveValue('m');
            await agreed.expect.not.toBeChecked();
            await state.expect.toHaveText('/m');
        }
        await query.fill('drx');
        {
            await query.expect.toHaveValue('drx');
            await state.expect.toHaveText('drx/m');
        }
        await clear.click();
        {
            await query.expect.toHaveValue('');
            await state.expect.toHaveText('/m');
        }
        await size.selectOption('s');
        {
            await size.expect.toHaveValue('s');
            await state.expect.toHaveText('/s');
        }
        await large.click();
        {
            await size.expect.toHaveValue('l');
            await state.expect.toHaveText('/l');
        }
        await agreed.check();
        await agreed.uncheck();
        await agree.click();
        {
            await agreed.expect.toBeChecked();
        }
    });

    test('class.<name> toggles a class and combines with an interpolated class', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="progress" type="number">40</x-variable>
                <div id="bar" class="bar {{progress() > 50 ? 'tall' : ''}}" class.done="progress() >= 100"></div>
                <button id="advance" onclick="progress(value => Math.min(100, value + 30))">Advance</button>
            </x-app>
        `);
        const bar = drx.node('bar');
        const advance = drx.node('advance');
        {
            await bar.expect.toHaveClass('bar');
        }
        await advance.click();
        {
            await bar.expect.toHaveClass('bar tall');
        }
        await advance.click();
        {
            await bar.expect.toHaveClass('bar tall done');
        }
    });

    test('style.<property> sets a kebab-case style property from an expression', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="width" type="number">40</x-variable>
                <div id="bar" style="height: 8px" style.width="width() + 'px'" style.background-color="'rgb(1, 2, 3)'"></div>
                <button id="grow" onclick="width(80)">Grow</button>
            </x-app>
        `);
        const bar = drx.node('bar');
        const grow = drx.node('grow');
        {
            await bar.expect.toHaveCSS('height', '8px');
            await bar.expect.toHaveCSS('width', '40px');
            await bar.expect.toHaveCSS('background-color', 'rgb(1, 2, 3)');
        }
        await grow.click();
        {
            await bar.expect.toHaveCSS('height', '8px');
            await bar.expect.toHaveCSS('width', '80px');
            await bar.expect.toHaveCSS('background-color', 'rgb(1, 2, 3)');
        }
    });

    test('html renders an html string in place of the element children', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <div id="html" html="{{'&lt;strong id=strong&gt;bold&lt;/strong&gt;'}}">
                    <span id="child">Child</span>
                </div>
            </x-app>
        `);
        const child = drx.node('child');
        const strong = drx.node('strong');
        {
            await child.expect.not.toBeAttached();
            await strong.expect.toHaveText('bold');
        }
    });

    test('returning false from an event handler prevents the default action', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-variable name="clicks" type="number">0</x-variable>
                <a id="link" href="#/elsewhere" onclick="clicks(value => value + 1); return false">Stay here ({{clicks()}})</a>
            </x-app>
        `, { hash: '#/start' });
        const link = drx.node('link');
        {
            await link.expect.toHaveText('Stay here (0)');
            await expect(page).toHaveURL(/#\/start$/);
        }
        await link.click();
        {
            await link.expect.toHaveText('Stay here (1)');
            await expect(page).toHaveURL(/#\/start$/);
        }
    });

    test('event handlers expose event and this', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="details" type="string">""</x-variable>
                <button id="button" onclick="details(event.type + ' ' + this.id)">Click</button>
                <p id="details">{{details()}}</p>
            </x-app>
        `);
        const button = drx.node('button');
        const details = drx.node('details');
        {
            await details.expect.toHaveText('');
        }
        await button.click();
        {
            await details.expect.toHaveText('click button');
        }
    });

    test('svg markup renders in the svg namespace including x-for', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="values" type="array">[20, 45, 30]</x-variable>
                <svg id="chart" width="200" height="80" viewBox="0 0 200 80">
                    <x-for each="values()" as="value" index="i">
                        <rect class="bar" x="{{i() * 50}}" y="{{80 - value()}}" width="40" height="{{value()}}" fill="teal"></rect>
                    </x-for>
                </svg>
            </x-app>
        `);
        const bars = drx.node('chart').locator('rect.bar');
        {
            await expect(bars).toHaveCount(3);
            expect(await bars.evaluateAll(rects => rects.map(rect => rect.namespaceURI))).toEqual([
                'http://www.w3.org/2000/svg',
                'http://www.w3.org/2000/svg',
                'http://www.w3.org/2000/svg'
            ]);
            expect(await bars.evaluateAll(rects => rects.map(rect => rect.getAttribute('height')))).toEqual(['20', '45', '30']);
        }
    });

    test('select value applies to options rendered by x-for', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="size" type="string">"m"</x-variable>
                <x-variable name="sizes" type="array">["s", "m", "l"]</x-variable>
                <select id="size" value="{{size()}}" onchange="size(event.target.value)">
                    <x-for each="sizes()" as="option">
                        <option value="{{option()}}">{{option()}}</option>
                    </x-for>
                </select>
                <button id="large" onclick="size('l')">Large</button>
                <p id="state">{{size()}}</p>
            </x-app>
        `);
        const size = drx.node('size');
        const large = drx.node('large');
        const state = drx.node('state');
        {
            await size.expect.toHaveValue('m');
            await state.expect.toHaveText('m');
        }
        await size.selectOption('s');
        {
            await size.expect.toHaveValue('s');
            await state.expect.toHaveText('s');
        }
        await large.click();
        {
            await size.expect.toHaveValue('l');
            await state.expect.toHaveText('l');
        }
    });

    test('option selected follows its expression even after the user picks another option', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="size" type="string">"m"</x-variable>
                <select id="size" onchange="size(event.target.value)">
                    <option value="s" selected="{{size() === 's'}}">Small</option>
                    <option value="m" selected="{{size() === 'm'}}">Medium</option>
                    <option value="l" selected="{{size() === 'l'}}">Large</option>
                </select>
                <button id="large" onclick="size('l')">Large</button>
                <p id="state">{{size()}}</p>
            </x-app>
        `);
        const size = drx.node('size');
        const large = drx.node('large');
        const state = drx.node('state');
        {
            await size.expect.toHaveValue('m');
            await state.expect.toHaveText('m');
        }
        await size.selectOption('s');
        {
            await size.expect.toHaveValue('s');
            await state.expect.toHaveText('s');
        }
        await large.click();
        {
            await size.expect.toHaveValue('l');
            await state.expect.toHaveText('l');
        }
    });
});
