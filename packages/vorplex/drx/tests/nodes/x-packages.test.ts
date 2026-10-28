import { test } from '../fixtures/drx';

test.describe('<x-packages>', () => {
    test('makes npm packages available to bare script imports', async ({ drx }) => {
        test.slow();
        await drx.render(`
            <x-app>
                <x-packages>{ "lodash": "^4.17.21" }</x-packages>
                <script type="application/typescript">
                    import { upperCase } from 'lodash';

                    export default DRX.defineApp(drx => class {
                        onMount() { console.log(upperCase('drx packages are working')); }
                    });
                </script>
            </x-app>
        `);
        {
            await drx.logged('DRX PACKAGES ARE WORKING');
        }
    });

    test('components, nested components and their services use the app packages', async ({ drx }) => {
        test.slow();
        await drx.render(`
            <x-app>
                <x-packages>{ "lodash": "^4.17.21" }</x-packages>
                <x-component name="outer">
                    <x-component name="inner">
                        <x-service name="shouter">
                            <script type="application/typescript">
                                import { upperCase } from 'lodash';

                                export default DRX.defineService(drx => class {
                                    shout(text: string) { return upperCase(text); }
                                });
                            </script>
                        </x-service>
                        <script type="application/typescript">
                            import { camelCase } from 'lodash';

                            export default DRX.defineComponent(drx => class {
                                onMount() { console.log(camelCase('nested component') + ' ' + drx.services.shouter.shout('nested service')); }
                            });
                        </script>
                    </x-component>
                    <x-component-instance component="inner"></x-component-instance>
                </x-component>
                <x-component-instance component="outer"></x-component-instance>
            </x-app>
        `);
        {
            await drx.logged('nestedComponent NESTED SERVICE');
        }
    });
});
