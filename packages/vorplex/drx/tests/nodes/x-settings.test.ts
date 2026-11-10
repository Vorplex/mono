import { expect, test } from '../fixtures/drx';

test.describe('<x-settings>', () => {
    test('exposes its JSON as the settings local and drx.settings', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-settings>{ "title": "Portal", "api": { "url": "https://api.example.com" } }</x-settings>
                <h1 id="title">{{settings.title}}</h1>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { console.log('script ' + drx.settings.api.url); }
                    });
                </script>
            </x-app>
        `);
        const title = drx.node('title');
        {
            await title.expect.toHaveText('Portal');
            await drx.logged('script https://api.example.com');
        }
    });

    test('reads a src file through the loader', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-settings src="./settings.json"></x-settings>
                <p id="mode">{{settings.mode}}</p>
            </x-app>
        `, {
            files: { 'settings.json': '{ "mode": "from-file" }' }
        });
        const mode = drx.node('mode');
        {
            await mode.expect.toHaveText('from-file');
        }
    });

    test('reads an absolute src url', async ({ drx, page }) => {
        await page.route('https://config.example.com/settings.json', route => route.fulfill({ json: { mode: 'from-url' } }));
        await drx.render(`
            <x-app>
                <x-settings src="https://config.example.com/settings.json"></x-settings>
                <p id="mode">{{settings.mode}}</p>
            </x-app>
        `);
        const mode = drx.node('mode');
        {
            await mode.expect.toHaveText('from-url');
        }
    });

    test('settings drive an api url', async ({ drx, page }) => {
        const request = page.waitForRequest('https://api.example.com/todos');
        await page.route('https://api.example.com/todos', route => route.fulfill({ json: [] }));
        await drx.render(`
            <x-app>
                <x-settings>{ "api": { "url": "https://api.example.com" } }</x-settings>
                <x-api name="todos" url="{{settings.api.url}}">
                    <x-endpoint name="list" path="/todos"></x-endpoint>
                </x-api>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { drx.apis.todos.endpoints.list.request(); }
                    });
                </script>
            </x-app>
        `);
        {
            expect((await request).url()).toBe('https://api.example.com/todos');
        }
    });

    test('settings reach pages, components and services', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-settings>{ "name": "shared" }</x-settings>
                <x-service name="probe">
                    <script type="application/typescript">
                        export default DRX.defineService(drx => class {
                            constructor() { console.log('service ' + drx.settings.name); }
                        });
                    </script>
                </x-service>
                <x-component name="badge">
                    <span id="component">{{settings.name}}</span>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            onMount() { console.log('component ' + drx.settings.name); }
                        });
                    </script>
                </x-component>
                <x-page name="home">
                    <p id="page">{{settings.name}}</p>
                    <x-component-instance component="badge"></x-component-instance>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        const page = drx.node('page');
        const component = drx.node('component');
        {
            await page.expect.toHaveText('shared');
            await component.expect.toHaveText('shared');
            await drx.logged('component shared');
            await drx.logged('service shared');
        }
    });

    test('settings is an empty object when the app declares none', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <p id="keys">{{Object.keys(settings).length}}</p>
            </x-app>
        `);
        const keys = drx.node('keys');
        {
            await keys.expect.toHaveText('0');
        }
    });
});
