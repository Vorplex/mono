import config from '../../playwright.config';
import { expect, test } from '../fixtures/drx';

const ui = new URL('/tests/app/ui/', config.use.baseURL).href;

const library = `
    <x-app>
        <x-type name="priority">{ "type": "enum", "flags": ["low", "high"] }</x-type>
        <x-variable name="count" type="number">0</x-variable>
        <x-asset name="logo" src="https://example.com/logo.png"></x-asset>
        <x-asset name="icon" src="./icon.svg"></x-asset>
        <x-service name="greeter">
            <script type="application/typescript">
                export default DRX.defineService(drx => class {
                    greet(name) { return 'Hello ' + name; }
                });
            </script>
        </x-service>
        <x-component name="badge">
            <x-property name="label" type="string"></x-property>
            <span class="badge">{{label()}}</span>
        </x-component>
        <x-component name="card">
            <x-property name="title" type="string"></x-property>
            <div class="card">
                <x-component-instance component="badge" label="Card {{title()}}"></x-component-instance>
            </div>
        </x-component>
        <p id="showcase">Showcase</p>
    </x-app>
`;

test.describe('<x-libraries>', () => {
    test('the app and its pages use library components by namespace', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "${ui}" }</x-libraries>
                <x-page name="home">
                    <x-component-instance component="ui.badge" label="Page"></x-component-instance>
                </x-page>
                <x-component-instance component="ui.badge" label="App"></x-component-instance>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `, { files: { 'ui/index.html': library } });
        const badges = page.locator('.badge');
        const showcase = drx.node('showcase');
        {
            await expect(badges).toHaveText(['App', 'Page']);
            await showcase.expect.not.toBeAttached();
            await expect(page.getByText('./ui/')).toHaveCount(0);
        }
    });

    test('a library component resolves its sibling components inside the library', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "${ui}" }</x-libraries>
                <x-component name="badge">
                    <span class="badge">Consumer badge</span>
                </x-component>
                <x-component-instance component="ui.card" title="One"></x-component-instance>
            </x-app>
        `, { files: { 'ui/index.html': library } });
        const badges = page.locator('.badge');
        {
            await expect(badges).toHaveText(['Card One']);
        }
    });

    test('library variables have one instance shared by every consumer', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "${ui}" }</x-libraries>
                <x-component name="counter">
                    <p id="component-count">Component {{ui.count()}}</p>
                </x-component>
                <button id="increment" onclick="ui.count(value => value + 1)">App {{ui.count()}}</button>
                <x-component-instance component="counter"></x-component-instance>
            </x-app>
        `, { files: { 'ui/index.html': library } });
        const increment = drx.node('increment');
        const componentCount = drx.node('component-count');
        {
            await increment.expect.toHaveText('App 0');
            await componentCount.expect.toHaveText('Component 0');
        }
        await increment.click();
        {
            await increment.expect.toHaveText('App 1');
            await componentCount.expect.toHaveText('Component 1');
        }
    });

    test('every component, nested or not, uses the app libraries', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "${ui}" }</x-libraries>
                <x-component name="outer">
                    <x-component name="inner">
                        <p id="inner">{{typeof ui}}</p>
                        <x-component-instance component="ui.badge" label="Inner"></x-component-instance>
                    </x-component>
                    <p id="outer">{{typeof ui}}</p>
                    <x-component-instance component="inner"></x-component-instance>
                </x-component>
                <x-component-instance component="outer"></x-component-instance>
            </x-app>
        `, { files: { 'ui/index.html': library } });
        const inner = drx.node('inner');
        const outer = drx.node('outer');
        const badges = page.locator('.badge');
        {
            await inner.expect.toHaveText('object');
            await outer.expect.toHaveText('object');
            await expect(badges).toHaveText(['Inner']);
        }
    });

    test('libraries declared on a component are ignored', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="probe">
                    <x-libraries>{ "kit": "${ui}" }</x-libraries>
                    <p id="probe">{{typeof kit}}</p>
                </x-component>
                <x-component-instance component="probe"></x-component-instance>
            </x-app>
        `, { files: { 'ui/index.html': library } });
        const probe = drx.node('probe');
        {
            await probe.expect.toHaveText('undefined');
        }
    });

    test('scripts reach library services and variables through drx.libraries', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "${ui}" }</x-libraries>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() {
                            console.log(drx.libraries.ui.services.greeter.greet('app'));
                            console.log('count ' + drx.libraries.ui.variables.count.get());
                        }
                    });
                </script>
            </x-app>
        `, { files: { 'ui/index.html': library } });
        {
            await drx.logged('Hello app');
            await drx.logged('count 0');
        }
    });

    test('the library URL query string carries over to its imports and relative assets', async ({ drx, page }) => {
        const imported = page.waitForRequest('**/tests/app/ui/library.html?ref=main');
        const asset = page.waitForRequest('**/tests/app/ui/icon.svg?ref=main');
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "${ui}index.html?ref=main" }</x-libraries>
                <x-component-instance component="ui.badge" label="Imported"></x-component-instance>
                <img id="icon" src="{{ui.asset.icon}}">
            </x-app>
        `, { files: { 'ui/index.html': '<x-import src="./library.html"></x-import>', 'ui/library.html': library, 'ui/icon.svg': '<svg></svg>' } });
        const badges = page.locator('.badge');
        const icon = drx.node('icon');
        {
            expect((await imported).url()).toMatch(/\/tests\/app\/ui\/library\.html\?ref=main$/);
            expect((await asset).url()).toMatch(/\/tests\/app\/ui\/icon\.svg\?ref=main$/);
            await expect(badges).toHaveText(['Imported']);
            await icon.expect.toHaveAttribute('src', /^blob:/);
        }
    });

    test('relative library URLs are not loaded', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "./ui/" }</x-libraries>
                <x-component-instance component="ui.badge" label="Relative"></x-component-instance>
            </x-app>
        `, { files: { 'ui/index.html': library } });
        const badges = page.locator('.badge');
        {
            await expect.poll(() => drx.errors.join(' ')).toContain('Unknown component with name "ui.badge"');
            await expect(badges).toHaveCount(0);
        }
    });

    test('library assets resolve through the namespace, relative ones against the library', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-libraries>{ "ui": "${ui}" }</x-libraries>
                <img id="logo" src="{{ui.asset.logo}}">
                <img id="icon" src="{{ui.asset.icon}}">
            </x-app>
        `, { files: { 'ui/index.html': library, 'ui/icon.svg': '<svg id="library-icon"></svg>' } });
        const logo = drx.node('logo');
        const icon = drx.node('icon');
        {
            await logo.expect.toHaveAttribute('src', 'https://example.com/logo.png');
            await icon.expect.toHaveAttribute('src', /^blob:/);
            const response = await page.evaluate(async src => {
                const response = await fetch(src);
                return { type: response.headers.get('content-type'), text: await response.text() };
            }, await icon.getAttribute('src'));
            expect(response).toEqual({ type: 'image/svg+xml', text: '<svg id="library-icon"></svg>' });
        }
    });

    test('libraries that depend on each other render', async ({ drx, page }) => {
        const a = new URL('/tests/app/a/', config.use.baseURL).href;
        const b = new URL('/tests/app/b/', config.use.baseURL).href;
        const tile = (name: string, other: string, url: string) => `
            <x-app>
                <x-libraries>{ "${other}": "${url}" }</x-libraries>
                <x-variable name="label" type="string">"${name.toUpperCase()}"</x-variable>
                <x-component name="tile">
                    <span class="tile">${name.toUpperCase()} {{${other}.label()}}</span>
                </x-component>
            </x-app>
        `;
        await drx.render(`
            <x-app>
                <x-libraries>{ "a": "${a}", "b": "${b}" }</x-libraries>
                <x-component-instance component="a.tile"></x-component-instance>
                <x-component-instance component="b.tile"></x-component-instance>
            </x-app>
        `, { files: { 'a/index.html': tile('a', 'b', b), 'b/index.html': tile('b', 'a', a) } });
        const tiles = page.locator('.tile');
        {
            await expect(tiles).toHaveText(['A B', 'B A']);
        }
    });
});
