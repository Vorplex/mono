import { expect, test } from '../fixtures/drx';

test.describe('<x-route>', () => {
    test('matches by prefix by default', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/notes">
                    <p id="notes">Notes</p>
                </x-route>
            </x-app>
        `, { hash: '#/notes/42' });
        const notes = drx.node('notes');
        {
            await notes.expect.toBeVisible();
        }
    });

    test('exact only matches when nothing is left over', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/" exact>
                    <p id="home">Home</p>
                </x-route>
                <x-route route="/">
                    <p id="any">Any</p>
                </x-route>
            </x-app>
        `, { hash: '#/notes' });
        const home = drx.node('home');
        const any = drx.node('any');
        {
            await home.expect.not.toBeAttached();
            await any.expect.toBeVisible();
        }
        await drx.navigate('#/');
        {
            await home.expect.toBeVisible();
            await any.expect.toBeVisible();
        }
    });

    test('matches paths leniently', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/notes" exact>
                    <p id="notes">Notes</p>
                </x-route>
            </x-app>
        `, { hash: '#notes' });
        const notes = drx.node('notes');
        {
            await notes.expect.toBeVisible();
        }
        await drx.navigate('#/notes/');
        {
            await notes.expect.toBeVisible();
        }
        await drx.navigate('#/other');
        {
            await notes.expect.not.toBeAttached();
        }
        await drx.navigate('#/notes');
        {
            await notes.expect.toBeVisible();
        }
    });

    test('fallback route renders only when no other route at its level matches', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <a id="home-link" href="#/">Home</a>
                <a id="missing-link" href="#/missing">Broken link</a>
                <x-route route="/" exact>
                    <h1 id="home">Home</h1>
                </x-route>
                <x-route>
                    <h1 id="not-found">Page not found</h1>
                </x-route>
            </x-app>
        `, { hash: '#/' });
        const homeLink = drx.node('home-link');
        const missingLink = drx.node('missing-link');
        const home = drx.node('home');
        const notFound = drx.node('not-found');
        {
            await home.expect.toBeVisible();
            await notFound.expect.not.toBeAttached();
        }
        await missingLink.click();
        {
            await home.expect.not.toBeAttached();
            await notFound.expect.toBeVisible();
        }
        await homeLink.click();
        {
            await home.expect.toBeVisible();
            await notFound.expect.not.toBeAttached();
        }
    });

    test('fallback counts routes nested in elements and ignores routes that are not rendered', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <div>
                    <x-route route="/nested">
                        <p id="nested">Nested</p>
                    </x-route>
                </div>
                <x-if condition="false">
                    <x-route route="/hidden">
                        <p id="hidden">Hidden</p>
                    </x-route>
                </x-if>
                <x-route>
                    <p id="fallback">Fallback</p>
                </x-route>
            </x-app>
        `, { hash: '#/nested' });
        const nested = drx.node('nested');
        const hidden = drx.node('hidden');
        const fallback = drx.node('fallback');
        {
            await nested.expect.toBeVisible();
            await hidden.expect.not.toBeAttached();
            await fallback.expect.not.toBeAttached();
        }
        await drx.navigate('#/hidden');
        {
            await nested.expect.not.toBeAttached();
            await hidden.expect.not.toBeAttached();
            await fallback.expect.toBeVisible();
        }
    });

    test('exposes params to the template and to pages mounted under it', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/posts/{id}">
                    <p id="template">Template {{router.params.id()}}</p>
                    <x-page-container page="post"></x-page-container>
                </x-route>
                <x-page name="post">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            onMount() { console.log('page params ' + JSON.stringify(drx.router.params)); }
                        });
                    </script>
                    <p id="post-page">Page {{router.params.id()}}</p>
                </x-page>
            </x-app>
        `, { hash: '#/posts/42' });
        const template = drx.node('template');
        const postPage = drx.node('post-page');
        {
            await template.expect.toHaveText('Template 42');
            await postPage.expect.toHaveText('Page 42');
            await drx.logged('page params {"id":"42"}');
        }
        await drx.navigate('#/posts/7');
        {
            await template.expect.toHaveText('Template 7');
            await postPage.expect.toHaveText('Page 7');
        }
    });

    test('router.active matches by prefix and exactly when asked', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <a id="home" href="#/" class.active="router.active('/', true)">Home</a>
                <a id="notes" href="#/notes" class.active="router.active('/notes')">Notes</a>
            </x-app>
        `, { hash: '#/notes/42' });
        const home = drx.node('home');
        const notes = drx.node('notes');
        {
            await home.expect.not.toHaveClass('active');
            await notes.expect.toHaveClass('active');
        }
        await home.click();
        {
            await home.expect.toHaveClass('active');
            await notes.expect.not.toHaveClass('active');
        }
    });

    test('relative paths resolve against the enclosing route', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-route route="/posts/{id}">
                    <button id="view" class.active="router.active('./', true)" onclick="router.navigate('./')">View</button>
                    <button id="edit" class.active="router.active('./edit')" onclick="router.navigate('./edit')">Edit</button>
                    <button id="up" onclick="router.navigate('../')">Up</button>
                    <x-route route="/edit">
                        <p id="editing">Editing post {{router.params.id()}}</p>
                    </x-route>
                </x-route>
            </x-app>
        `, { hash: '#/posts/42' });
        const view = drx.node('view');
        const edit = drx.node('edit');
        const up = drx.node('up');
        const editing = drx.node('editing');
        {
            await expect(page).toHaveURL(/#\/posts\/42$/);
            await view.expect.toHaveClass('active');
            await edit.expect.not.toHaveClass('active');
            await editing.expect.not.toBeAttached();
        }
        await edit.click();
        {
            await expect(page).toHaveURL(/#\/posts\/42\/edit$/);
            await view.expect.not.toHaveClass('active');
            await edit.expect.toHaveClass('active');
            await editing.expect.toHaveText('Editing post 42');
        }
        await view.click();
        {
            await expect(page).toHaveURL(/#\/posts\/42$/);
            await view.expect.toHaveClass('active');
            await edit.expect.not.toHaveClass('active');
            await editing.expect.not.toBeAttached();
        }
        await up.click();
        {
            await expect(page).toHaveURL(/#\/posts$/);
            await view.expect.not.toBeAttached();
            await edit.expect.not.toBeAttached();
            await up.expect.not.toBeAttached();
        }
    });

    test('links and router.navigate drive navigation', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/" exact>
                    <x-page-container page="home"></x-page-container>
                </x-route>
                <x-route route="/posts/{id}">
                    <x-page-container page="post"></x-page-container>
                </x-route>
                <x-page name="home">
                    <a id="link" href="#/posts/42">View post 42</a>
                    <button id="navigate" onclick="router.navigate('/posts/7')">View post 7</button>
                </x-page>
                <x-page name="post">
                    <p id="post">Post id: {{router.params.id()}}</p>
                    <a id="back" href="#/">Home</a>
                </x-page>
            </x-app>
        `, { hash: '#/' });
        const link = drx.node('link');
        const navigate = drx.node('navigate');
        const post = drx.node('post');
        const back = drx.node('back');
        {
            await link.expect.toBeVisible();
            await navigate.expect.toBeVisible();
            await post.expect.not.toBeAttached();
        }
        await link.click();
        {
            await link.expect.not.toBeAttached();
            await navigate.expect.not.toBeAttached();
            await post.expect.toHaveText('Post id: 42');
        }
        await back.click();
        {
            await link.expect.toBeVisible();
            await navigate.expect.toBeVisible();
            await post.expect.not.toBeAttached();
        }
        await navigate.click();
        {
            await link.expect.not.toBeAttached();
            await navigate.expect.not.toBeAttached();
            await post.expect.toHaveText('Post id: 7');
        }
    });

    test('a page script can redirect on mount', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-route route="/old-page" exact>
                    <x-page-container page="redirect"></x-page-container>
                </x-route>
                <x-route route="/new-page" exact>
                    <x-page-container page="newPage"></x-page-container>
                </x-route>
                <x-page name="redirect">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            onMount() { drx.router.navigate('/new-page'); }
                        });
                    </script>
                    <p id="redirecting">Redirecting</p>
                </x-page>
                <x-page name="newPage">
                    <h1 id="new">New page</h1>
                </x-page>
            </x-app>
        `, { hash: '#/old-page' });
        const redirecting = drx.node('redirecting');
        const newPage = drx.node('new');
        {
            await expect(page).toHaveURL(/#\/new-page$/);
            await redirecting.expect.not.toBeAttached();
            await newPage.expect.toBeVisible();
        }
    });

    test('browser back and forward restore earlier routes', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <a id="notes-link" href="#/notes">Notes</a>
                <a id="settings-link" href="#/settings">Settings</a>
                <x-route route="/" exact>
                    <p id="home">Home</p>
                </x-route>
                <x-route route="/notes">
                    <p id="notes">Notes</p>
                </x-route>
                <x-route route="/settings">
                    <p id="settings">Settings</p>
                </x-route>
            </x-app>
        `, { hash: '#/' });
        const notesLink = drx.node('notes-link');
        const settingsLink = drx.node('settings-link');
        const home = drx.node('home');
        const notes = drx.node('notes');
        const settings = drx.node('settings');
        {
            await home.expect.toBeVisible();
            await notes.expect.not.toBeAttached();
            await settings.expect.not.toBeAttached();
        }
        await notesLink.click();
        await settingsLink.click();
        {
            await home.expect.not.toBeAttached();
            await notes.expect.not.toBeAttached();
            await settings.expect.toBeVisible();
        }
        await page.goBack();
        {
            await home.expect.not.toBeAttached();
            await notes.expect.toBeVisible();
            await settings.expect.not.toBeAttached();
        }
        await page.goBack();
        {
            await home.expect.toBeVisible();
            await notes.expect.not.toBeAttached();
            await settings.expect.not.toBeAttached();
        }
        await page.goForward();
        {
            await home.expect.not.toBeAttached();
            await notes.expect.toBeVisible();
            await settings.expect.not.toBeAttached();
        }
    });

    test('a route stays mounted while it keeps matching', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/posts">
                    <p id="layout">Posts</p>
                    <x-page-container page="sidebar"></x-page-container>
                    <x-route route="/{id}">
                        <p id="post">Post {{router.params.id()}}</p>
                    </x-route>
                </x-route>
                <x-page name="sidebar">
                    <script type="application/typescript">
                        export default DRX.definePage(drx => class {
                            onMount() { console.log('sidebar mounted'); }
                            onUnmount() { console.log('sidebar unmounted'); }
                        });
                    </script>
                    <p id="sidebar">Sidebar</p>
                </x-page>
            </x-app>
        `, { hash: '#/posts/1' });
        const mounts = () => drx.logs.filter(log => log === 'sidebar mounted');
        const layout = drx.node('layout');
        const post = drx.node('post');
        const sidebar = drx.node('sidebar');
        {
            await layout.expect.toBeVisible();
            await post.expect.toHaveText('Post 1');
            await sidebar.expect.toBeVisible();
            await drx.logged('sidebar mounted');
        }
        await layout.evaluate(element => element.setAttribute('data-marked', 'true'));
        await drx.navigate('#/posts/2');
        {
            await layout.expect.toHaveAttribute('data-marked', 'true');
            await post.expect.toHaveText('Post 2');
            await sidebar.expect.toBeVisible();
            expect(mounts()).toHaveLength(1);
        }
        await drx.navigate('#/about');
        {
            await layout.expect.not.toBeAttached();
            await post.expect.not.toBeAttached();
            await sidebar.expect.not.toBeAttached();
            await drx.logged('sidebar unmounted');
        }
    });

    test('nested routes merge params and have their own fallback level', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/users/{id}">
                    <x-route route="/settings" exact>
                        <p id="settings">Settings for {{router.params.id()}}</p>
                    </x-route>
                    <x-route>
                        <p id="user-fallback">No page for {{router.params.id()}}</p>
                    </x-route>
                </x-route>
                <x-route>
                    <p id="not-found">Not found</p>
                </x-route>
            </x-app>
        `, { hash: '#/users/7/settings' });
        const settings = drx.node('settings');
        const userFallback = drx.node('user-fallback');
        const notFound = drx.node('not-found');
        {
            await settings.expect.toHaveText('Settings for 7');
            await userFallback.expect.not.toBeAttached();
            await notFound.expect.not.toBeAttached();
        }
        await drx.navigate('#/users/7/other');
        {
            await settings.expect.not.toBeAttached();
            await userFallback.expect.toHaveText('No page for 7');
            await notFound.expect.not.toBeAttached();
        }
        await drx.navigate('#/other');
        {
            await settings.expect.not.toBeAttached();
            await userFallback.expect.not.toBeAttached();
            await notFound.expect.toBeVisible();
        }
    });

    test('optional parameters match with or without their segment', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/users/{id}/{tab?}" exact>
                    <p id="user">User {{router.params.id()}}, tab {{router.params.tab() ?? 'none'}}</p>
                </x-route>
            </x-app>
        `, { hash: '#/users/7' });
        const user = drx.node('user');
        {
            await user.expect.toHaveText('User 7, tab none');
        }
        await drx.navigate('#/users/7/settings');
        {
            await user.expect.toHaveText('User 7, tab settings');
        }
        await drx.navigate('#/users/7/settings/extra');
        {
            await user.expect.not.toBeAttached();
        }
    });

    test('catch-all parameters capture every remaining segment', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/docs/{...path}">
                    <p id="doc">Doc {{router.params.path() ?? 'none'}}</p>
                </x-route>
            </x-app>
        `, { hash: '#/docs/guides/routing.md' });
        const doc = drx.node('doc');
        {
            await doc.expect.toHaveText('Doc guides/routing.md');
        }
        await drx.navigate('#/docs');
        {
            await doc.expect.toHaveText('Doc none');
        }
    });

    test('parameters can sit inside a segment', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/files/report-{year}.pdf" exact>
                    <p id="report">Report for {{router.params.year()}}</p>
                </x-route>
            </x-app>
        `, { hash: '#/files/report-2026.pdf' });
        const report = drx.node('report');
        {
            await report.expect.toHaveText('Report for 2026');
        }
        await drx.navigate('#/files/summary-2026.pdf');
        {
            await report.expect.not.toBeAttached();
        }
    });

    test('matching ignores letter case and the query string', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-route route="/posts" exact>
                    <p id="posts">Posts</p>
                </x-route>
                <x-route route="/users/{name}" exact>
                    <p id="user">User {{router.params.name()}}</p>
                </x-route>
            </x-app>
        `, { hash: '#/Posts?sort=new' });
        const posts = drx.node('posts');
        const user = drx.node('user');
        {
            await posts.expect.toBeVisible();
            await user.expect.not.toBeAttached();
        }
        await drx.navigate('#/USERS/Ada');
        {
            await posts.expect.not.toBeAttached();
            await user.expect.toHaveText('User Ada');
        }
    });
});
