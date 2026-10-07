import { expect, test } from '../fixtures/drx';

test.describe('text', () => {
    test('interpolates expressions and updates when locals change', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="name" type="string">"Ada"</x-variable>
                <p id="greeting">Hello {{name()}}! You are {{name().length}} letters.</p>
                <button id="rename" onclick="name('Grace')">Rename</button>
            </x-app>
        `);
        const greeting = drx.node('greeting');
        const rename = drx.node('rename');
        {
            await greeting.expect.toHaveText('Hello Ada! You are 3 letters.');
        }
        await rename.click();
        {
            await greeting.expect.toHaveText('Hello Grace! You are 5 letters.');
        }
    });

    test('shows interpolated values as text, never as html', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <p id="text">{{'&lt;b&gt;bold&lt;/b&gt;'}}</p>
            </x-app>
        `);
        const text = drx.node('text');
        {
            await text.expect.toHaveText('<b>bold</b>');
            await expect(text.locator('b')).not.toBeAttached();
        }
    });

    test('keeps spaces on the same line and drops line breaks with their indentation', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <p id="inline"><b>1</b> of <b>10</b></p>
                <p id="joined">
                    <a href="#/">Home</a>
                    <a href="#/about">Joined</a>
                </p>
            </x-app>
        `);
        const inline = drx.node('inline');
        const joined = drx.node('joined');
        {
            await inline.expect.toHaveJSProperty('textContent', '1 of 10');
            await joined.expect.toHaveJSProperty('textContent', 'HomeJoined');
        }
    });

    test('a failing expression logs its path and skips only that node', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <p id="before">Before</p>
                <p id="failing">{{missing()}}</p>
                <p id="after">After</p>
            </x-app>
        `);
        const before = drx.node('before');
        const failing = drx.node('failing');
        const after = drx.node('after');
        {
            await before.expect.toBeVisible();
            await failing.expect.toHaveText('');
            await after.expect.toBeVisible();
            await expect.poll(() => drx.errors.join('\n')).toMatch(/Failed to render node at path ".+\/text\(\)" in app\./);
        }
    });
});
