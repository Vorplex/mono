import { expect, test } from '../fixtures/drx';

test.describe('<x-dependency-tree>', () => {
    test('is declarative and not rendered as content', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-packages>{ "lodash": "^4.17.21" }</x-packages>
                <x-dependency-tree>{ "lodash": { "version": "4.17.21" } }</x-dependency-tree>
                <h1 id="title">Home</h1>
            </x-app>
        `);
        const appText = () => page.locator('x-app').evaluate(app => app.shadowRoot.textContent);
        const title = drx.node('title');
        {
            await title.expect.toHaveText('Home');
            expect(await appText()).not.toContain('lodash');
        }
    });
});
