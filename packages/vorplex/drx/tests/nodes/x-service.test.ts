import { expect, test } from '../fixtures/drx';

test.describe('<x-service>', () => {
    test('is reached from the app script through drx.services', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-service name="logger">
                    <script type="application/typescript">
                        export default DRX.defineService(drx => class {
                            log(message) { console.log(message); }
                        });
                    </script>
                </x-service>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { drx.services.logger.log('App mounted'); }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('App mounted');
        }
    });

    test('app services are reached from page scripts', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-service name="logger">
                    <script type="application/typescript">
                        export default DRX.defineService(drx => class {
                            log(message) { console.log(message); }
                        });
                    </script>
                </x-service>
                <x-page name="home">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            onMount() { drx.services.logger.log('Page mounted'); }
                        });
                    </script>
                </x-page>
                <x-page-container page="home"></x-page-container>
            </x-app>
        `);
        {
            await drx.logged('Page mounted');
        }
    });

    test('a component service is only reachable from that component', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="widget">
                    <x-service name="widgetLogger">
                        <script type="application/typescript">
                            export default DRX.defineService(drx => class {
                                log(message) { console.log(message); }
                            });
                        </script>
                    </x-service>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            onMount() { drx.services.widgetLogger.log('Widget mounted'); }
                        });
                    </script>
                </x-component>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { console.log('app sees widgetLogger ' + typeof drx.services.widgetLogger); }
                    });
                </script>
                <x-component-instance component="widget"></x-component-instance>
            </x-app>
        `);
        {
            await drx.logged('Widget mounted');
            await drx.logged('app sees widgetLogger undefined');
        }
    });

    test('a service reaches sibling services', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-service name="formatter">
                    <script type="application/typescript">
                        export default DRX.defineService(drx => class {
                            currency(amount) { return '$' + amount.toFixed(2); }
                        });
                    </script>
                </x-service>
                <x-service name="logger">
                    <script type="application/typescript">
                        export default DRX.defineService(drx => class {
                            logPrice(amount) { console.log(drx.services.formatter.currency(amount)); }
                        });
                    </script>
                </x-service>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { drx.services.logger.logPrice(19.9); }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('$19.90');
        }
    });

    test('a service reaches apis declared on the same owner', async ({ drx, page }) => {
        await page.route('https://api.example.com/todos', route => route.fulfill({ json: [{ id: 1, title: 'Write tests' }] }));
        await drx.render(`
            <x-app>
                <x-api name="todoApi" url="https://api.example.com">
                    <x-endpoint name="list" path="/todos" method="GET">
                        <x-response>{ "type": "array" }</x-response>
                    </x-endpoint>
                </x-api>
                <x-service name="logger">
                    <script type="application/typescript">
                        export default DRX.defineService(drx => class {
                            async logTodos() {
                                const response = await drx.apis.todoApi.list.request();
                                console.log('todos ' + JSON.stringify(await response.value()));
                            }
                        });
                    </script>
                </x-service>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { drx.services.logger.logTodos(); }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('todos [{"id":1,"title":"Write tests"}]');
        }
    });

    test('has only apis and services and is never mounted', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-service name="probe">
                    <script type="application/typescript">
                        export default DRX.defineService(drx => class {
                            constructor() {
                                const api = drx as any;
                                console.log('service access ' + [typeof api.apis, typeof api.services, typeof api.app, typeof api.page, typeof api.component, typeof api.router, typeof api.modal].join(','));
                            }
                            onMount() { console.log('service mounted'); }
                            onUnmount() { console.log('service unmounted'); }
                        });
                    </script>
                </x-service>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { console.log('app mounted ' + typeof drx.services.probe); }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('service access object,object,undefined,undefined,undefined,undefined,undefined');
            await drx.logged('app mounted object');
            expect(drx.logs).not.toContain('service mounted');
        }
    });
});
