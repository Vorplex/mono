import { test } from '../fixtures/drx';

test.describe('<x-page-container>', () => {
    test('embeds a page by name', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-page name="dashboard">
                    <h1 id="title">Dashboard</h1>
                </x-page>
                <x-page-container page="dashboard"></x-page-container>
            </x-app>
        `);
        const title = drx.node('title');
        {
            await title.expect.toHaveText('Dashboard');
        }
    });

    test('page attribute can be interpolated to swap the embedded page', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="current" type="string">"first"</x-variable>
                <x-page name="first">
                    <p id="first">First</p>
                </x-page>
                <x-page name="second">
                    <p id="second">Second</p>
                </x-page>
                <x-page-container page="{{current()}}"></x-page-container>
                <button id="switch" onclick="current('second')">Switch</button>
            </x-app>
        `);
        const first = drx.node('first');
        const second = drx.node('second');
        const switchPage = drx.node('switch');
        {
            await first.expect.toBeVisible();
            await second.expect.not.toBeAttached();
        }
        await switchPage.click();
        {
            await first.expect.not.toBeAttached();
            await second.expect.toBeVisible();
        }
    });

    test('embedded page restarts from the app locals, not the embedding page', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="appValue" type="string">"app"</x-variable>
                <x-page name="outer">
                    <x-variable name="outerValue" type="string">"outer"</x-variable>
                    <x-page-container page="inner"></x-page-container>
                </x-page>
                <x-page name="inner">
                    <p id="inner">{{appValue()}} {{typeof outerValue}}</p>
                </x-page>
                <x-page-container page="outer"></x-page-container>
            </x-app>
        `);
        const inner = drx.node('inner');
        {
            await inner.expect.toHaveText('app undefined');
        }
    });

    test('embedded page keeps the active router', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/posts/{id}">
                    <x-page-container page="post"></x-page-container>
                </x-route>
                <x-page name="post">
                    <p id="post">Post {{router.params.id()}}</p>
                </x-page>
            </x-app>
        `, { hash: '#/posts/42' });
        const post = drx.node('post');
        {
            await post.expect.toHaveText('Post 42');
        }
        await drx.navigate('#/posts/7');
        {
            await post.expect.toHaveText('Post 7');
        }
    });
});
