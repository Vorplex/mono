import { expect, test } from '../fixtures/drx';

test.describe('<x-import>', () => {
    test('splices drx markup, ts scripts and css styles in at its position', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-import src="./header.drx"></x-import>
                <x-import src="./app.ts"></x-import>
                <x-import src="./app.css"></x-import>
                <p id="body" class="title">Body</p>
            </x-app>
        `, {
            files: {
                'header.drx': '<h1 id="header">Header</h1>',
                'app.ts': "export default DRX.defineApp(drx => class { onMount() { console.log('imported script mounted'); } });",
                'app.css': '.title { color: rgb(1, 2, 3); }'
            }
        });
        const order = () => page.locator('x-app').evaluate(app => Array.from(app.shadowRoot.querySelectorAll('#header, #body')).map(element => element.id));
        const header = drx.node('header');
        const body = drx.node('body');
        {
            await header.expect.toHaveText('Header');
            await body.expect.toHaveCSS('color', 'rgb(1, 2, 3)');
            expect(await order()).toEqual(['header', 'body']);
            await drx.logged('imported script mounted');
        }
    });

    test('imported markup can declare nodes', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-import src="./pages.drx"></x-import>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `, {
            files: {
                'pages.drx': `
                    <x-page name="home">
                        <p id="home">Imported page</p>
                    </x-page>
                `
            }
        });
        const home = drx.node('home');
        {
            await home.expect.toHaveText('Imported page');
        }
    });
});
