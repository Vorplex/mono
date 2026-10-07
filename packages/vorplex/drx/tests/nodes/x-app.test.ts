import { expect, test } from '../fixtures/drx';

test.describe('<x-app>', () => {
    test('renders its template into its own open shadow root', async ({ drx, page }) => {
        await drx.render(`
            <x-app name="dashboardApp">
                <h1 id="title">Home</h1>
            </x-app>
        `);
        const app = page.locator('x-app');
        const title = drx.node('title');
        {
            await title.expect.toHaveText('Home');
            expect(await app.evaluate(app => app.shadowRoot.mode)).toBe('open');
            expect(await app.evaluate(app => app.shadowRoot.getElementById('title')?.textContent)).toBe('Home');
            expect(await page.evaluate(() => document.getElementById('title'))).toBeNull();
        }
    });

    test('app style applies to the document, the app, its pages but not components', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <style>
                    :root { --accent: rgb(1, 2, 3); }
                    body { background-color: rgb(4, 5, 6); }
                    .card { color: rgb(7, 8, 9); }
                </style>
                <x-page name="summary">
                    <div id="page-card" class="card">Page card</div>
                </x-page>
                <x-component name="badge">
                    <style>.badge { color: var(--accent); }</style>
                    <span id="badge" class="badge">Badge</span>
                    <span id="component-card" class="card">Component card</span>
                </x-component>
                <div id="app-card" class="card">App card</div>
                <x-page-container page="summary"></x-page-container>
                <x-component-instance component="badge"></x-component-instance>
            </x-app>
        `);
        const body = page.locator('body');
        const pageCard = drx.node('page-card');
        const badge = drx.node('badge');
        const componentCard = drx.node('component-card');
        const appCard = drx.node('app-card');
        {
            await expect(body).toHaveCSS('background-color', 'rgb(4, 5, 6)');
            await pageCard.expect.toHaveCSS('color', 'rgb(7, 8, 9)');
            await badge.expect.toHaveCSS('color', 'rgb(1, 2, 3)');
            await componentCard.expect.not.toHaveCSS('color', 'rgb(7, 8, 9)');
            await appCard.expect.toHaveCSS('color', 'rgb(7, 8, 9)');
        }
    });

    test('app style rules do not match markup inside its pages by structure', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <style>.layout > .sidebar { color: rgb(1, 2, 3); }</style>
                <x-page name="side">
                    <div id="page-sidebar" class="sidebar">Page sidebar</div>
                </x-page>
                <div class="layout">
                    <div id="app-sidebar" class="sidebar">App sidebar</div>
                    <x-page-container page="side"></x-page-container>
                </div>
            </x-app>
        `);
        const pageSidebar = drx.node('page-sidebar');
        const appSidebar = drx.node('app-sidebar');
        {
            await pageSidebar.expect.not.toHaveCSS('color', 'rgb(1, 2, 3)');
            await appSidebar.expect.toHaveCSS('color', 'rgb(1, 2, 3)');
        }
    });

    test('style interpolation uses app locals and updates when they change', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-variable name="accent" type="string">"rgb(1, 2, 3)"</x-variable>
                <style>
                    :root { --accent: {{accent()}}; }
                    .box { color: {{accent()}}; }
                </style>
                <p id="box" class="box">Box</p>
                <button id="switch" onclick="accent('rgb(4, 5, 6)')">Switch</button>
            </x-app>
        `);
        const rootAccent = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
        const box = drx.node('box');
        const switchAccent = drx.node('switch');
        {
            await box.expect.toHaveCSS('color', 'rgb(1, 2, 3)');
            expect(await rootAccent()).toBe('rgb(1, 2, 3)');
        }
        await switchAccent.click();
        {
            await box.expect.toHaveCSS('color', 'rgb(4, 5, 6)');
            expect(await rootAccent()).toBe('rgb(4, 5, 6)');
        }
    });

    test('pages and components are rendered as display: contents', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-page name="home">
                    <p id="page-content">Page</p>
                </x-page>
                <x-component name="badge">
                    <p id="component-content">Component</p>
                </x-component>
                <x-page-container page="home"></x-page-container>
                <x-component-instance component="badge"></x-component-instance>
            </x-app>
        `);
        const pageContent = drx.node('page-content');
        const componentContent = drx.node('component-content');
        const pageHost = page.locator('x-page');
        const componentHost = page.locator('x-component-instance');
        {
            await pageContent.expect.toBeVisible();
            await componentContent.expect.toBeVisible();
            await expect(pageHost).toHaveCSS('display', 'contents');
            await expect(componentHost).toHaveCSS('display', 'contents');
        }
    });

    test('events are retargeted to the app host at document level', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="clicked" type="string">"nothing yet"</x-variable>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() {
                            document.addEventListener('click', event => {
                                const target = event.composedPath()[0] as HTMLElement;
                                drx.app.variables.clicked.set(target.tagName.toLowerCase() + ' (event.target was ' + (event.target as HTMLElement).tagName.toLowerCase() + ')');
                            });
                        }
                    });
                </script>
                <button id="button">Click me</button>
                <p id="clicked">{{clicked()}}</p>
            </x-app>
        `);
        const button = drx.node('button');
        const clicked = drx.node('clicked');
        {
            await clicked.expect.toHaveText('nothing yet');
        }
        await button.click();
        {
            await clicked.expect.toHaveText('button (event.target was x-app)');
        }
    });

    test('onMount is called once, after the template has mounted', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { console.log('mounted with ' + document.querySelector('x-app').shadowRoot.querySelectorAll('#title').length + ' title'); }
                    });
                </script>
                <h1 id="title">Home</h1>
            </x-app>
        `);
        const title = drx.node('title');
        {
            await title.expect.toBeVisible();
            await drx.logged('mounted with 1 title');
            expect(drx.logs.filter(log => log.startsWith('mounted'))).toHaveLength(1);
        }
    });

    test('exposes router with empty params to the app script', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { console.log('params ' + JSON.stringify(drx.router.params) + ' route ' + drx.router.route); }
                    });
                </script>
            </x-app>
        `, { hash: '#/somewhere' });
        {
            await drx.logged('params {} route /somewhere');
        }
    });

    test('app script methods are callable from the app and page templates', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        greet(from) { console.log('hello from ' + from); }
                    });
                </script>
                <button id="app-greet" onclick="greet('app')">App</button>
                <x-page name="home">
                    <button id="page-greet" onclick="greet('page')">Page</button>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        const appGreet = drx.node('app-greet');
        const pageGreet = drx.node('page-greet');
        await appGreet.click();
        {
            await drx.logged('hello from app');
        }
        await pageGreet.click();
        {
            await drx.logged('hello from page');
        }
    });

    test('a syntax error in any script stops the app and names the script and line', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-page name="orders">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            broken( {
                        });
                    </script>
                </x-page>
                <h1 id="title">Never</h1>
            </x-app>
        `);
        const error = page.locator('pre');
        const title = drx.node('title');
        {
            await expect(error).toContainText(/script:\/\/pages\/orders\.ts:\d+:\d+/);
            await title.expect.not.toBeAttached();
        }
    });

    test('CSS a library injects into the head applies everywhere and app styles win over it', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <style>.shared { color: blue; }</style>
                <x-page name="home">
                    <p id="page-library" class="library">Page</p>
                </x-page>
                <x-component name="badge">
                    <p id="component-library" class="library">Component</p>
                </x-component>
                <p id="app-library" class="library">App</p>
                <p id="app-shared" class="shared">Shared</p>
                <x-page-container page="home"></x-page-container>
                <x-component-instance component="badge"></x-component-instance>
            </x-app>
        `);
        const pageLibrary = drx.node('page-library');
        const componentLibrary = drx.node('component-library');
        const appLibrary = drx.node('app-library');
        const appShared = drx.node('app-shared');
        {
            await pageLibrary.expect.not.toHaveCSS('color', 'rgb(255, 0, 0)');
            await componentLibrary.expect.not.toHaveCSS('color', 'rgb(255, 0, 0)');
            await appLibrary.expect.not.toHaveCSS('color', 'rgb(255, 0, 0)');
            await appShared.expect.toHaveCSS('color', 'rgb(0, 0, 255)');
        }
        await page.addStyleTag({ content: '.library { color: red; } .shared { color: red; }' });
        {
            await pageLibrary.expect.toHaveCSS('color', 'rgb(255, 0, 0)');
            await componentLibrary.expect.toHaveCSS('color', 'rgb(255, 0, 0)');
            await appLibrary.expect.toHaveCSS('color', 'rgb(255, 0, 0)');
            await appShared.expect.toHaveCSS('color', 'rgb(0, 0, 255)');
        }
    });

    test('app style styles the modal backdrop', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <style>::backdrop { background-color: red; }</style>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        open() { drx.pages.dialog.showModal(); }
                    });
                </script>
                <x-page name="dialog">
                    <p id="dialog-content">Dialog</p>
                </x-page>
                <button id="open" onclick="open()">Open</button>
            </x-app>
        `);
        const backdrop = () => page.locator('dialog').evaluate(dialog => getComputedStyle(dialog, '::backdrop').backgroundColor);
        const dialogContent = drx.node('dialog-content');
        const open = drx.node('open');
        {
            await dialogContent.expect.not.toBeAttached();
        }
        await open.click();
        {
            await dialogContent.expect.toBeVisible();
            expect(await backdrop()).toBe('rgb(255, 0, 0)');
        }
    });

    test('keyframes in the app style work in the app and its pages but not in components', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <style>
                    @keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }
                    .pulse { animation: pulse 1s infinite; }
                </style>
                <x-page name="home">
                    <p id="page-pulse" class="pulse">Page</p>
                </x-page>
                <x-component name="badge">
                    <style>.pulse { animation: pulse 1s infinite; }</style>
                    <p id="component-pulse" class="pulse">Component</p>
                </x-component>
                <p id="app-pulse" class="pulse">App</p>
                <x-page-container page="home"></x-page-container>
                <x-component-instance component="badge"></x-component-instance>
            </x-app>
        `);
        const animations = (node: ReturnType<typeof drx.node>) => node.evaluate(element => element.getAnimations().length);
        const pagePulse = drx.node('page-pulse');
        const componentPulse = drx.node('component-pulse');
        const appPulse = drx.node('app-pulse');
        {
            await pagePulse.expect.toBeVisible();
            await componentPulse.expect.toBeVisible();
            await appPulse.expect.toBeVisible();
            expect(await animations(pagePulse)).toBe(1);
            expect(await animations(componentPulse)).toBe(0);
            expect(await animations(appPulse)).toBe(1);
        }
    });
});
