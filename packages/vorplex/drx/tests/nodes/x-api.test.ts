import { expect, test } from '../fixtures/drx';

const types = `
    <x-type name="Todo">{ "type": "object", "properties": { "id": { "type": "number" }, "title": { "type": "string" } } }</x-type>
`;

test.describe('<x-api>', () => {
    test('requests an endpoint and parses the response value', async ({ drx, page }) => {
        await page.route('https://api.example.com/todos', route => route.fulfill({ json: [{ id: 1, title: 'Write tests' }] }));
        await drx.render(`
            <x-app>
                ${types}
                <x-api name="todos" url="https://api.example.com">
                    <x-endpoint name="list" path="/todos">
                        <x-response>{ "type": "array", "itemDefinition": { "type": "ref", "id": "Todo" } }</x-response>
                    </x-endpoint>
                </x-api>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        async onMount() {
                            const response = await drx.apis.todos.list.request();
                            console.log('list ' + response.raw.status + ' ' + JSON.stringify(await response.value()));
                        }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('list 200 [{"id":1,"title":"Write tests"}]');
        }
    });

    test('method defaults to GET and query parameters are appended', async ({ drx, page }) => {
        const request = page.waitForRequest('https://api.example.com/todos?**');
        await page.route('https://api.example.com/todos?**', route => route.fulfill({ json: [] }));
        await drx.render(`
            <x-app>
                <x-api name="todos" url="https://api.example.com">
                    <x-endpoint name="list" path="/todos">
                        <x-parameter name="userId"></x-parameter>
                    </x-endpoint>
                </x-api>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { drx.apis.todos.list.request({ parameters: { userId: '7' } }); }
                    });
                </script>
            </x-app>
        `);
        const sent = await request;
        {
            expect(sent.method()).toBe('GET');
            expect(new URL(sent.url()).searchParams.get('userId')).toBe('7');
        }
    });

    test('sends a JSON body and headers with the declared method', async ({ drx, page }) => {
        const request = page.waitForRequest(request => request.url() === 'https://api.example.com/todos' && request.method() === 'POST');
        await page.route('https://api.example.com/todos', route => route.fulfill({ json: { id: 2, title: 'Created' } }));
        await drx.render(`
            <x-app>
                ${types}
                <x-api name="todos" url="https://api.example.com">
                    <x-endpoint name="create" path="/todos" method="POST">
                        <x-header name="Authorization"></x-header>
                        <x-body>{ "type": "object", "properties": { "title": { "type": "string" } } }</x-body>
                        <x-response>{ "type": "ref", "id": "Todo" }</x-response>
                    </x-endpoint>
                </x-api>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        async onMount() {
                            const response = await drx.apis.todos.create.request({ headers: { Authorization: 'Bearer token' }, body: { title: 'Created' } });
                            console.log('created ' + JSON.stringify(await response.value()));
                        }
                    });
                </script>
            </x-app>
        `);
        const sent = await request;
        {
            expect(sent.method()).toBe('POST');
            expect(sent.postDataJSON()).toEqual({ title: 'Created' });
            expect(sent.headers()['authorization']).toBe('Bearer token');
            expect(sent.headers()['content-type']).toContain('application/json');
            await drx.logged('created {"id":2,"title":"Created"}');
        }
    });

    test('substitutes path parameters', async ({ drx, page }) => {
        const request = page.waitForRequest('https://api.example.com/todos/1');
        await page.route('https://api.example.com/todos/1', route => route.fulfill({ json: {} }));
        await drx.render(`
            <x-app>
                <x-api name="todos" url="https://api.example.com">
                    <x-endpoint name="remove" path="/todos/{id}" method="DELETE">
                        <x-parameter name="id" required="true"></x-parameter>
                    </x-endpoint>
                </x-api>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() { drx.apis.todos.remove.request({ parameters: { id: '1' } }); }
                    });
                </script>
            </x-app>
        `);
        const sent = await request;
        {
            expect(sent.method()).toBe('DELETE');
            expect(sent.url()).toBe('https://api.example.com/todos/1');
        }
    });

    test('rejects when a required parameter or header is missing', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-api name="todos" url="https://api.example.com">
                    <x-endpoint name="remove" path="/todos/{id}" method="DELETE">
                        <x-parameter name="id" required="true"></x-parameter>
                    </x-endpoint>
                    <x-endpoint name="secure" path="/secure">
                        <x-header name="Authorization" required="true"></x-header>
                    </x-endpoint>
                </x-api>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        async onMount() {
                            const parameter = await drx.apis.todos.remove.request().then(() => 'resolved', () => 'rejected');
                            const header = await drx.apis.todos.secure.request().then(() => 'resolved', () => 'rejected');
                            console.log('missing ' + parameter + ' ' + header);
                        }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('missing rejected rejected');
        }
    });

    test('rejects a response that does not satisfy its declared type', async ({ drx, page }) => {
        await page.route('https://api.example.com/todos', route => route.fulfill({ json: { not: 'an array' } }));
        await drx.render(`
            <x-app>
                <x-api name="todos" url="https://api.example.com">
                    <x-endpoint name="list" path="/todos">
                        <x-response>{ "type": "array" }</x-response>
                    </x-endpoint>
                </x-api>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        async onMount() {
                            const response = await drx.apis.todos.list.request();
                            console.log('value ' + await response.value().then(() => 'resolved', () => 'rejected'));
                        }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('value rejected');
        }
    });

    test('a component only reaches its own apis', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-api name="appApi" url="https://api.example.com"></x-api>
                <x-component name="probe">
                    <x-api name="componentApi" url="https://component.example.com"></x-api>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            onMount() { console.log('component apis ' + Object.keys(drx.apis).join(',')); }
                        });
                    </script>
                </x-component>
                <x-component-instance component="probe"></x-component-instance>
            </x-app>
        `);
        {
            await drx.logged('component apis componentApi');
        }
    });
});
