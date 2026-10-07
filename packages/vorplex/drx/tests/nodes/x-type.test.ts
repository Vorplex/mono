import { test } from '../fixtures/drx';

test.describe('<x-type>', () => {
    test('can be referenced by name from a variable type', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-type name="priority">{ "type": "enum", "flags": ["low", "medium", "high"] }</x-type>
                <x-variable name="taskPriority" type="priority">"medium"</x-variable>
                <p id="priority">{{taskPriority()}}</p>
            </x-app>
        `);
        const priority = drx.node('priority');
        {
            await priority.expect.toHaveText('medium');
        }
    });

    test('validates a variable against the named schema', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-type name="priority">{ "type": "enum", "flags": ["low", "medium", "high"] }</x-type>
                <x-variable name="taskPriority" type="priority">"medium"</x-variable>
                <script type="application/typescript">
                    export default DRX.defineApp(drx => class {
                        onMount() {
                            const variable = drx.app.variables.taskPriority;
                            const valid = variable.validate()[1].length;
                            variable.set('urgent');
                            const invalid = variable.validate()[1].length;
                            console.log('errors ' + valid + ' ' + (invalid > 0));
                        }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('errors 0 true');
        }
    });

    test('is resolved from a component own declarations', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="probe">
                    <x-type name="count">{ "type": "number" }</x-type>
                    <x-variable name="value" type="count">1</x-variable>
                    <script type="application/typescript">
                        export default DRX.defineComponent(drx => class {
                            onMount() {
                                const variable = drx.component.variables.value;
                                const valid = variable.validate()[1].length;
                                variable.set('text');
                                console.log('component errors ' + valid + ' ' + (variable.validate()[1].length > 0));
                            }
                        });
                    </script>
                </x-component>
                <x-component-instance component="probe"></x-component-instance>
            </x-app>
        `);
        {
            await drx.logged('component errors 0 true');
        }
    });
});
