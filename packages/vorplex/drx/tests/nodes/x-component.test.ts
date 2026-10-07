import { expect, test } from '../fixtures/drx';

test.describe('<x-component>', () => {
    test('renders each instance into its own open shadow root', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-component name="alert">
                    <div class="alert">Alert</div>
                </x-component>
                <x-component-instance component="alert"></x-component-instance>
                <x-component-instance component="alert"></x-component-instance>
            </x-app>
        `);
        const alerts = page.locator('.alert');
        {
            await expect(alerts).toHaveCount(2);
            expect(await alerts.evaluateAll(alerts => alerts.map(alert => (alert.getRootNode() as ShadowRoot).mode))).toEqual(['open', 'open']);
            expect(await alerts.evaluateAll(([first, second]) => first.getRootNode() !== second.getRootNode())).toBe(true);
        }
    });

    test('has no access to app or page state', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="appSecret" type="string">"app"</x-variable>
                <x-component name="probe">
                    <p id="probe">{{typeof appSecret}} {{typeof pageSecret}}</p>
                </x-component>
                <x-page name="home">
                    <x-variable name="pageSecret" type="string">"page"</x-variable>
                    <x-component-instance component="probe"></x-component-instance>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        const probe = drx.node('probe');
        {
            await probe.expect.toHaveText('undefined undefined');
        }
    });

    test('is styled only by its own style and inherits custom properties and color', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <style>
                    :root { --accent: rgb(1, 2, 3); }
                    .label { color: rgb(255, 0, 0); }
                    .wrap { color: rgb(0, 0, 255); }
                </style>
                <x-component name="badge">
                    <style>
                        .label { color: var(--accent); }
                        .outside { color: rgb(0, 128, 0); }
                        :root { --component-leak: 1; }
                    </style>
                    <span id="component-label" class="label">Component label</span>
                    <span id="component-plain">Plain</span>
                </x-component>
                <p id="app-label" class="label">App label</p>
                <p id="app-outside" class="outside">App outside</p>
                <div class="wrap">
                    <x-component-instance component="badge"></x-component-instance>
                </div>
            </x-app>
        `);
        const rootLeak = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--component-leak'));
        const componentLabel = drx.node('component-label');
        const componentPlain = drx.node('component-plain');
        const appLabel = drx.node('app-label');
        const appOutside = drx.node('app-outside');
        {
            expect(await rootLeak()).toBe('');
            await componentLabel.expect.toHaveCSS('color', 'rgb(1, 2, 3)');
            await componentPlain.expect.toHaveCSS('color', 'rgb(0, 0, 255)');
            await appLabel.expect.toHaveCSS('color', 'rgb(255, 0, 0)');
            await appOutside.expect.not.toHaveCSS('color', 'rgb(0, 128, 0)');
        }
    });

    test('style interpolation uses the component locals including properties', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="tone" type="string">"rgb(1, 2, 3)"</x-variable>
                <x-component name="badge">
                    <x-property name="tone" type="string"></x-property>
                    <style>.badge { background-color: {{tone()}}; }</style>
                    <span id="badge" class="badge">Badge</span>
                </x-component>
                <x-component-instance component="badge" tone="{{tone()}}"></x-component-instance>
                <button id="switch" onclick="tone('rgb(4, 5, 6)')">Switch</button>
            </x-app>
        `);
        const badge = drx.node('badge');
        const switchTone = drx.node('switch');
        {
            await badge.expect.toHaveCSS('background-color', 'rgb(1, 2, 3)');
        }
        await switchTone.click();
        {
            await badge.expect.toHaveCSS('background-color', 'rgb(4, 5, 6)');
        }
    });

    test('script is instantiated once per instance', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="counter">
                    <x-property name="key" type="string"></x-property>
                    <x-variable name="count" type="number">0</x-variable>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            increment() { drx.component.variables.count.set(value => value + 1); }
                        });
                    </script>
                    <button id="{{key()}}" onclick="increment()">Clicked {{count()}} times</button>
                </x-component>
                <x-component-instance component="counter" key="first"></x-component-instance>
                <x-component-instance component="counter" key="second"></x-component-instance>
            </x-app>
        `);
        const first = drx.node('first');
        const second = drx.node('second');
        {
            await first.expect.toHaveText('Clicked 0 times');
            await second.expect.toHaveText('Clicked 0 times');
        }
        await first.click();
        await first.click();
        {
            await first.expect.toHaveText('Clicked 2 times');
            await second.expect.toHaveText('Clicked 0 times');
        }
        await second.click();
        {
            await first.expect.toHaveText('Clicked 2 times');
            await second.expect.toHaveText('Clicked 1 times');
        }
    });

    test('drx.component.root is the instance own shadow root', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-component name="field">
                    <x-property name="key" type="string"></x-property>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            focusInput() { (drx.component.root.getElementById('input') as HTMLInputElement).focus(); }
                        });
                    </script>
                    <input id="input" name="{{key()}}">
                    <button id="focus-{{key()}}" onclick="focusInput()">Focus</button>
                </x-component>
                <x-component-instance component="field" key="first"></x-component-instance>
                <x-component-instance component="field" key="second"></x-component-instance>
            </x-app>
        `);
        const firstInput = page.locator('input[name="first"]');
        const focusFirst = drx.node('focus-first');
        const secondInput = page.locator('input[name="second"]');
        const focusSecond = drx.node('focus-second');
        await focusSecond.click();
        {
            await expect(firstInput).not.toBeFocused();
            await expect(secondInput).toBeFocused();
        }
        await focusFirst.click();
        {
            await expect(firstInput).toBeFocused();
            await expect(secondInput).not.toBeFocused();
        }
    });

    test('onMount runs after the template mounted and onUnmount when the instance unmounts', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="show" type="boolean">true</x-variable>
                <x-component name="probe">
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            onMount() { console.log('mounted with ' + drx.component.root.querySelectorAll('#probe').length + ' probe'); }
                            onUnmount() { console.log('unmounted'); }
                        });
                    </script>
                    <p id="probe">Probe</p>
                </x-component>
                <button id="toggle" onclick="show(value => !value)">Toggle</button>
                <x-if condition="show()">
                    <x-component-instance component="probe"></x-component-instance>
                </x-if>
            </x-app>
        `);
        const probe = drx.node('probe');
        const toggle = drx.node('toggle');
        {
            await probe.expect.toBeVisible();
            await drx.logged('mounted with 1 probe');
        }
        await toggle.click();
        {
            await probe.expect.not.toBeAttached();
            await drx.logged('unmounted');
        }
    });

    test('script has no app, page, router or modal', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="probe">
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            onMount() {
                                const api = drx as any;
                                console.log('access ' + [typeof api.app, typeof api.page, typeof api.router, typeof api.modal].join(','));
                            }
                        });
                    </script>
                </x-component>
                <x-component-instance component="probe"></x-component-instance>
            </x-app>
        `);
        {
            await drx.logged('access undefined,undefined,undefined,undefined');
        }
    });

    test('script methods are callable bare from its own template', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="greeter">
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            label() { return 'from component'; }
                            log() { console.log('component logged'); }
                        });
                    </script>
                    <button id="log" onclick="log()">{{label()}}</button>
                </x-component>
                <x-component-instance component="greeter"></x-component-instance>
            </x-app>
        `);
        const log = drx.node('log');
        {
            await log.expect.toHaveText('from component');
        }
        await log.click();
        {
            await drx.logged('component logged');
        }
    });

    test('can declare and instantiate nested components', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="outer">
                    <x-component name="inner">
                        <span id="inner">Inner</span>
                    </x-component>
                    <x-component-instance component="inner"></x-component-instance>
                </x-component>
                <x-component-instance component="outer"></x-component-instance>
            </x-app>
        `);
        const inner = drx.node('inner');
        {
            await inner.expect.toHaveText('Inner');
        }
    });

    test('its style can declare its own keyframes and properties', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="badge">
                    <style>
                        @keyframes spin { from { rotate: 0deg; } to { rotate: 360deg; } }
                        @property --size { syntax: '<length>'; inherits: false; initial-value: 40px; }
                        .spin { animation: spin 1s infinite; }
                        .box { width: var(--size); }
                    </style>
                    <p id="spin" class="spin">Spin</p>
                    <div id="box" class="box"></div>
                </x-component>
                <x-component-instance component="badge"></x-component-instance>
            </x-app>
        `);
        const spin = drx.node('spin');
        const box = drx.node('box');
        {
            expect(await spin.evaluate(element => element.getAnimations().length)).toBe(1);
            await box.expect.toHaveCSS('width', '40px');
        }
    });
});
