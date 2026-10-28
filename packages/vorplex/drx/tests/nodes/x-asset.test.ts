import { expect, test } from '../fixtures/drx';

test.describe('<x-asset>', () => {
    test('resolves an external asset to its url', async ({ drx, page }) => {
        await page.route('https://example.com/**', route => route.abort());
        await drx.render(`
            <x-app>
                <x-asset name="logo" src="https://example.com/logo.png"></x-asset>
                <img id="logo" src="{{asset.logo}}" />
                <p id="type">{{typeof asset.logo}}</p>
            </x-app>
        `);
        const logo = drx.node('logo');
        const type = drx.node('type');
        {
            await logo.expect.toHaveAttribute('src', 'https://example.com/logo.png');
            await type.expect.toHaveText('string');
        }
    });

    test('resolves an internal asset to a url serving its content with its type', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-asset name="note" type="text/plain">Hello asset</x-asset>
                <a id="note" href="{{asset.note}}">Note</a>
            </x-app>
        `);
        const note = drx.node('note');
        {
            await note.expect.toHaveAttribute('href', /^blob:/);
            const response = await page.evaluate(async href => {
                const response = await fetch(href);
                return { type: response.headers.get('content-type'), text: await response.text() };
            }, await note.getAttribute('href'));
            expect(response.type).toBe('text/plain');
            expect(response.text).toBe('Hello asset');
        }
    });

    test('a relative src is read through the loader, resolved against the file it is written in', async ({ drx, page }) => {
        await drx.render(`
            <x-app>
                <x-asset name="root" src="./images/root.svg"></x-asset>
                <x-import src="./parts/assets.html"></x-import>
                <x-import src="./top.html"></x-import>
                <p id="root">{{asset.root}}</p>
                <p id="nested">{{asset.nested}}</p>
                <p id="top">{{asset.top}}</p>
            </x-app>
        `, {
            files: {
                'parts/assets.html': '<x-asset name="nested" src="../images/nested.svg"></x-asset>',
                'top.html': '<x-import src="./parts/top.html"></x-import>',
                'parts/top.html': '<x-asset name="top" src="./top.svg"></x-asset>',
                'images/root.svg': '<svg id="root"></svg>',
                'images/nested.svg': '<svg id="nested"></svg>',
                'parts/top.svg': '<svg id="top"></svg>'
            }
        });
        const read = async (id: string) => page.evaluate(async src => {
            const response = await fetch(src);
            return { type: response.headers.get('content-type'), text: await response.text() };
        }, await drx.node(id).textContent());
        {
            await drx.node('root').expect.toHaveText(/^blob:/);
            expect(await read('root')).toEqual({ type: 'image/svg+xml', text: '<svg id="root"></svg>' });
            expect(await read('nested')).toEqual({ type: 'image/svg+xml', text: '<svg id="nested"></svg>' });
            expect(await read('top')).toEqual({ type: 'image/svg+xml', text: '<svg id="top"></svg>' });
        }
    });

    test('a relative src whose file is missing is left unresolved', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-asset name="missing" src="./missing.svg"></x-asset>
                <p id="missing">{{asset.missing}}</p>
            </x-app>
        `);
        const missing = drx.node('missing');
        {
            await missing.expect.toHaveText('./missing.svg');
        }
    });

    test('a component resolves its own assets', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-component name="badge">
                    <x-asset name="icon" src="https://example.com/icon.svg"></x-asset>
                    <p id="icon">{{asset.icon}}</p>
                </x-component>
                <x-component-instance component="badge"></x-component-instance>
            </x-app>
        `);
        const icon = drx.node('icon');
        {
            await icon.expect.toHaveText('https://example.com/icon.svg');
        }
    });
});
