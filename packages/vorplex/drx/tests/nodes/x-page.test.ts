import { expect, test } from '../fixtures/drx';

test.describe('<x-page>', () => {
    test('renders into its own open shadow root inside the app', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-page name="home">
                    <x-variable name="count" type="number">0</x-variable>
                    <button id="count" onclick="count(value => value + 1)">Clicked {{count()}} times</button>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        const app = page.locator('x-app');
        const host = page.locator('x-page');
        const count = drx.node('count');
        {
            await count.expect.toHaveText('Clicked 0 times');
            expect(await host.evaluate(host => host.shadowRoot.mode)).toBe('open');
            expect(await host.evaluate(host => host.shadowRoot.getElementById('count')?.textContent)).toBe('Clicked 0 times');
            expect(await app.evaluate(app => app.shadowRoot.getElementById('count'))).toBeNull();
        }
        await count.click();
        {
            await count.expect.toHaveText('Clicked 1 times');
        }
    });

    test('page style applies only to its own markup and wins over the app style', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <style>.title { color: rgb(1, 1, 1); font-weight: 700; }</style>
                <x-page name="first">
                    <style>
                        .title { color: rgb(2, 2, 2); }
                        .own { color: rgb(3, 3, 3); }
                        :root { --page-leak: 1; }
                    </style>
                    <h2 id="first-title" class="title">First</h2>
                    <p id="first-own" class="own">First own</p>
                    <x-page-container page="second"></x-page-container>
                    <x-component-instance component="probe"></x-component-instance>
                </x-page>
                <x-page name="second">
                    <h2 id="second-title" class="title">Second</h2>
                    <p id="second-own" class="own">Second own</p>
                </x-page>
                <x-component name="probe">
                    <p id="probe-own" class="own">Probe own</p>
                </x-component>
                <x-page-container page="first"></x-page-container>
            </x-app>
        `);
        const rootLeak = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--page-leak'));
        const firstTitle = drx.node('first-title');
        const firstOwn = drx.node('first-own');
        const secondTitle = drx.node('second-title');
        const secondOwn = drx.node('second-own');
        const probeOwn = drx.node('probe-own');
        {
            expect(await rootLeak()).toBe('');
            await firstTitle.expect.toHaveCSS('color', 'rgb(2, 2, 2)');
            await firstTitle.expect.toHaveCSS('font-weight', '700');
            await firstOwn.expect.toHaveCSS('color', 'rgb(3, 3, 3)');
            await secondTitle.expect.toHaveCSS('color', 'rgb(1, 1, 1)');
            await secondOwn.expect.not.toHaveCSS('color', 'rgb(3, 3, 3)');
            await probeOwn.expect.not.toHaveCSS('color', 'rgb(3, 3, 3)');
        }
    });

    test('style interpolation uses the page locals', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-page name="home">
                    <x-variable name="size" type="number">20</x-variable>
                    <style>.title { font-size: {{size()}}px; }</style>
                    <h2 id="title" class="title">Title</h2>
                    <button id="grow" onclick="size(30)">Grow</button>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        const title = drx.node('title');
        const grow = drx.node('grow');
        {
            await title.expect.toHaveCSS('font-size', '20px');
        }
        await grow.click();
        {
            await title.expect.toHaveCSS('font-size', '30px');
        }
    });

    test('script is instantiated fresh on each mount with lifecycle hooks', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="current" type="string">"first"</x-variable>
                <x-page name="first">
                    <x-variable name="count" type="number">0</x-variable>
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            constructor() { console.log('first created'); }
                            onMount() { console.log('first mounted with ' + drx.page.root.querySelectorAll('#first').length); }
                            onUnmount() { console.log('first unmounted'); }
                        });
                    </script>
                    <button id="first" onclick="count(value => value + 1)">{{count()}}</button>
                </x-page>
                <x-page name="second">
                    <p id="second">Second</p>
                </x-page>
                <x-page-container page="{{current()}}"></x-page-container>
                <button id="show-first" onclick="current('first')">First</button>
                <button id="show-second" onclick="current('second')">Second</button>
            </x-app>
        `);
        const created = () => drx.logs.filter(log => log === 'first created');
        const first = drx.node('first');
        const second = drx.node('second');
        const showFirst = drx.node('show-first');
        const showSecond = drx.node('show-second');
        {
            await first.expect.toHaveText('0');
            await second.expect.not.toBeAttached();
            await drx.logged('first mounted with 1');
            expect(created()).toHaveLength(1);
        }
        await first.click();
        {
            await first.expect.toHaveText('1');
            await second.expect.not.toBeAttached();
        }
        await showSecond.click();
        {
            await first.expect.not.toBeAttached();
            await second.expect.toBeVisible();
            await drx.logged('first unmounted');
        }
        await showFirst.click();
        {
            await first.expect.toHaveText('0');
            await second.expect.not.toBeAttached();
            await expect.poll(created).toHaveLength(2);
        }
    });

    test('drx.page.root scopes ids to the page', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-page name="panel">
                    <x-variable name="label" type="string">""</x-variable>
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            read() { drx.page.variables.label.set(drx.page.root.getElementById('box').textContent); }
                        });
                    </script>
                    <div id="box">Panel box</div>
                    <button id="read" onclick="read()">Read</button>
                    <p id="label">{{label()}}</p>
                </x-page>
                <div id="box">App box</div>
                <x-page-container page="panel"></x-page-container>
            </x-app>
        `);
        const read = drx.node('read');
        const label = drx.node('label');
        {
            await label.expect.toHaveText('');
        }
        await read.click();
        {
            await label.expect.toHaveText('Panel box');
        }
    });

    test('page methods are callable from its template and take priority over app methods', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        who() { return 'app'; }
                        shared() { return 'app shared'; }
                    });
                </script>
                <x-page name="home">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            who() { return 'page'; }
                        });
                    </script>
                    <p id="who">{{who()}}</p>
                    <p id="shared">{{shared()}}</p>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        const who = drx.node('who');
        const shared = drx.node('shared');
        {
            await who.expect.toHaveText('page');
            await shared.expect.toHaveText('app shared');
        }
    });

    test('script reaches the app instance and app variables', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="visits" type="number">0</x-variable>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        trackVisit(pageName) { console.log('Visited ' + pageName); }
                    });
                </script>
                <x-page name="home">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            onMount() {
                                drx.app.instance.trackVisit('home');
                                drx.app.variables.visits.set(value => value + 1);
                            }
                        });
                    </script>
                </x-page>
                <x-page-container page="home"></x-page-container>
                <p id="visits">{{visits()}}</p>
            </x-app>
        `);
        const visits = drx.node('visits');
        {
            await visits.expect.toHaveText('1');
            await drx.logged('Visited home');
        }
    });

    test('opens as a modal with data and resolves with the closed result', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <style>.modal-title { color: rgb(1, 2, 3); }</style>
                <x-page name="editPerson">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            save() { drx.modal.close(drx.modal.data()); }
                        });
                    </script>
                    <h2 id="modal-title" class="modal-title">Edit</h2>
                    <input id="name" value="{{modal.data.name()}}" onchange="modal.data.name(event.target.value)">
                    <button id="cancel" onclick="modal.close()">Cancel</button>
                    <button id="save" onclick="save()">Save</button>
                </x-page>
                <x-page name="home">
                    <x-variable name="person" type="any">{ "name": "Ada Lovelace", "age": 30 }</x-variable>
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            async edit() {
                                const result = await drx.pages.editPerson.showModal({ data: drx.page.variables.person.get() });
                                console.log('modal result ' + JSON.stringify(result));
                                if (result) drx.page.variables.person.set(result);
                            }
                        });
                    </script>
                    <p id="person">{{person.name()}}, age {{person.age()}}</p>
                    <button id="edit" onclick="edit()">Edit</button>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        const modalTitle = drx.node('modal-title');
        const name = drx.node('name');
        const cancel = drx.node('cancel');
        const save = drx.node('save');
        const person = drx.node('person');
        const edit = drx.node('edit');
        {
            await modalTitle.expect.not.toBeAttached();
            await person.expect.toHaveText('Ada Lovelace, age 30');
        }
        await edit.click();
        {
            await modalTitle.expect.toHaveCSS('color', 'rgb(1, 2, 3)');
            await name.expect.toHaveValue('Ada Lovelace');
            await person.expect.toHaveText('Ada Lovelace, age 30');
        }
        await cancel.click();
        {
            await modalTitle.expect.not.toBeAttached();
            await person.expect.toHaveText('Ada Lovelace, age 30');
            await drx.logged('modal result undefined');
        }
        await edit.click();
        await name.fill('Grace Hopper');
        await name.dispatchEvent('change');
        await save.click();
        {
            await modalTitle.expect.not.toBeAttached();
            await person.expect.toHaveText('Grace Hopper, age 30');
        }
    });
});
