import { expect, test } from '../fixtures/drx';

test.describe('<x-variable>', () => {
    test('is a callable signal that reads, writes and updates', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="count" type="number">0</x-variable>
                <button id="increment" onclick="count(value => value + 1)">Clicked {{count()}} times</button>
                <button id="set" onclick="count(10)">Set</button>
            </x-app>
        `);
        const increment = drx.node('increment');
        const set = drx.node('set');
        {
            await increment.expect.toHaveText('Clicked 0 times');
        }
        await increment.click();
        {
            await increment.expect.toHaveText('Clicked 1 times');
        }
        await set.click();
        {
            await increment.expect.toHaveText('Clicked 10 times');
        }
    });

    test('initial value is JSON content', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="name" type="string">"Ada"</x-variable>
                <x-variable name="items" type="array">[1, 2, 3]</x-variable>
                <x-variable name="user" type="any">{ "profile": { "age": 30 } }</x-variable>
                <x-variable name="empty"></x-variable>
                <p id="values">{{name()}} {{items().length}} {{user.profile.age()}} {{empty() == null}}</p>
            </x-app>
        `);
        const values = drx.node('values');
        {
            await values.expect.toHaveText('Ada 3 30 true');
        }
    });

    test('nested paths are signals where only the last segment is called', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="user" type="any">{ "profile": { "name": "Ada" } }</x-variable>
                <p id="name">{{user.profile.name()}}</p>
                <button id="rename" onclick="user.profile.name('Grace')">Rename</button>
            </x-app>
        `);
        const name = drx.node('name');
        const rename = drx.node('rename');
        {
            await name.expect.toHaveText('Ada');
        }
        await rename.click();
        {
            await name.expect.toHaveText('Grace');
        }
    });

    test('script api reads, writes, updates and resets', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="theme" type="string">"light"</x-variable>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        toggleTheme() {
                            drx.app.variables.theme.set(theme => theme === 'light' ? 'dark' : 'light');
                            console.log('theme ' + drx.app.variables.theme.get());
                        }
                        resetTheme() { drx.app.variables.theme.reset(); }
                    });
                </script>
                <p id="theme">{{theme()}}</p>
                <button id="toggle" onclick="toggleTheme()">Toggle</button>
                <button id="reset" onclick="resetTheme()">Reset</button>
            </x-app>
        `);
        const theme = drx.node('theme');
        const toggle = drx.node('toggle');
        const reset = drx.node('reset');
        {
            await theme.expect.toHaveText('light');
        }
        await toggle.click();
        {
            await drx.logged('theme dark');
            await theme.expect.toHaveText('dark');
        }
        await reset.click();
        {
            await theme.expect.toHaveText('light');
        }
    });

    test('subscribe calls back immediately and on change, and returns an unsubscribe', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="count" type="number">0</x-variable>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        unsubscribe = () => { };
                        onMount() { this.unsubscribe = drx.app.variables.count.subscribe(value => console.log('count is ' + value)); }
                        stop() { this.unsubscribe(); }
                    });
                </script>
                <button id="increment" onclick="count(value => value + 1)">{{count()}}</button>
                <button id="stop" onclick="stop()">Stop</button>
            </x-app>
        `);
        const increment = drx.node('increment');
        const stop = drx.node('stop');
        {
            await increment.expect.toHaveText('0');
            await drx.logged('count is 0');
        }
        await increment.click();
        {
            await increment.expect.toHaveText('1');
            await drx.logged('count is 1');
        }
        await stop.click();
        await increment.click();
        {
            await increment.expect.toHaveText('2');
            expect(drx.logs).not.toContain('count is 2');
        }
    });

    test('subscriptions end when the owner unmounts', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="count" type="number">0</x-variable>
                <x-variable name="show" type="boolean">true</x-variable>
                <x-page name="watcher">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            onMount() { drx.app.variables.count.subscribe(value => console.log('watched ' + value)); }
                        });
                    </script>
                </x-page>
                <x-if condition="show()">
                    <x-page-container page="watcher"></x-page-container>
                </x-if>
                <button id="hide" onclick="show(false)">Hide</button>
                <button id="increment" onclick="count(value => value + 1)">{{count()}}</button>
            </x-app>
        `);
        const hide = drx.node('hide');
        const increment = drx.node('increment');
        {
            await increment.expect.toHaveText('0');
            await drx.logged('watched 0');
        }
        await hide.click();
        await increment.click();
        {
            await increment.expect.toHaveText('1');
            expect(drx.logs).not.toContain('watched 1');
        }
    });

    test('validate returns the value and errors with message and path', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="count" type="number">0</x-variable>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() {
                            const [value, errors] = drx.app.variables.count.validate();
                            drx.app.variables.count.set('not a number');
                            const [, invalid] = drx.app.variables.count.validate();
                            console.log('validate ' + value + ' ' + errors.length + ' ' + (invalid.length > 0) + ' ' + (typeof invalid[0]?.message) + ' ' + (typeof invalid[0]?.path));
                        }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('validate 0 0 true string string');
        }
    });

    test('is scoped to the owner that declares it', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="appValue" type="string">"app"</x-variable>
                <x-page name="home">
                    <x-variable name="pageValue" type="string">"page"</x-variable>
                    <p id="page-values">{{appValue()}} {{pageValue()}}</p>
                </x-page>
                <x-page-container page="home"></x-page-container>
                <p id="app-values">{{typeof pageValue}}</p>
            </x-app>
        `);
        const pageValues = drx.node('page-values');
        const appValues = drx.node('app-values');
        {
            await pageValues.expect.toHaveText('app page');
            await appValues.expect.toHaveText('undefined');
        }
    });
});
