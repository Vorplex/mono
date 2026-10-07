import { expect, test } from '../fixtures/drx';

test.describe('<x-pwa-metadata>', () => {
    test('does not affect the live app', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-pwa-metadata>{ "name": "My App", "short_name": "App", "display": "standalone", "icons": [] }</x-pwa-metadata>
                <h1 id="title">Home</h1>
            </x-app>
        `);
        const manifest = page.locator('link[rel="manifest"]');
        const appText = () => page.locator('x-app').evaluate(app => app.shadowRoot.textContent);
        const title = drx.node('title');
        {
            await expect(manifest).not.toBeAttached();
            await title.expect.toHaveText('Home');
            expect(await appText()).not.toContain('My App');
        }
    });
});
