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
});
