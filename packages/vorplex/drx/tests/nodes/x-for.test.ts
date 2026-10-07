import { expect, test } from '../fixtures/drx';

test.describe('<x-for>', () => {
    test('renders its children once per array entry', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="items" type="array">["Milk", "Eggs", "Bread"]</x-variable>
                <ul id="list">
                    <x-for each="items()" as="item">
                        <li>{{item()}}</li>
                    </x-for>
                </ul>
            </x-app>
        `);
        const items = drx.node('list').locator('li');
        {
            await expect(items).toHaveText(['Milk', 'Eggs', 'Bread']);
        }
    });

    test('exposes as, index and key as signals when iterating an object', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="scores" type="any">{ "ada": 1, "grace": 2 }</x-variable>
                <ul id="list">
                    <x-for each="scores()" as="score" index="i" key="name">
                        <li>{{i()}} {{name()}}={{score()}}</li>
                    </x-for>
                </ul>
            </x-app>
        `);
        const items = drx.node('list').locator('li');
        {
            await expect(items).toHaveText(['0 ada=1', '1 grace=2']);
        }
    });

    test('tracks the collection reactively', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="items" type="array">["a"]</x-variable>
                <ul id="list">
                    <x-for each="items()" as="item">
                        <li>{{item()}}</li>
                    </x-for>
                </ul>
                <button id="add" onclick="items(value => [...value, 'b'])">Add</button>
                <button id="remove" onclick="items(value => value.slice(1))">Remove</button>
            </x-app>
        `);
        const items = drx.node('list').locator('li');
        const add = drx.node('add');
        const remove = drx.node('remove');
        {
            await expect(items).toHaveText(['a']);
        }
        await add.click();
        {
            await expect(items).toHaveText(['a', 'b']);
        }
        await remove.click();
        {
            await expect(items).toHaveText(['b']);
        }
        await remove.click();
        {
            await expect(items).toHaveCount(0);
        }
    });

    test('track keeps each item rendered element across re-renders', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="items" type="array">[{ "id": 1, "name": "A" }, { "id": 2, "name": "B" }]</x-variable>
                <ul id="list">
                    <x-for each="items()" as="item" track="id">
                        <li id="item-{{item.id()}}">{{item.name()}}</li>
                    </x-for>
                </ul>
                <button id="reverse" onclick="items(value => [...value].reverse())">Reverse</button>
            </x-app>
        `);
        const items = drx.node('list').locator('li');
        const item1 = drx.node('item-1');
        const item2 = drx.node('item-2');
        const reverse = drx.node('reverse');
        {
            await expect(items).toHaveText(['A', 'B']);
        }
        await item1.evaluate(element => element.setAttribute('data-marked', 'first'));
        await item2.evaluate(element => element.setAttribute('data-marked', 'second'));
        await reverse.click();
        {
            await expect(items).toHaveText(['B', 'A']);
            await item1.expect.toHaveAttribute('data-marked', 'first');
            await item2.expect.toHaveAttribute('data-marked', 'second');
        }
    });

    test('item locals only exist inside its own body', async ({ drx }) => {
        await drx.render(`
            <x-app>
                <x-variable name="items" type="array">["a"]</x-variable>
                <x-for each="items()" as="item" index="i">
                    <span id="inside">{{typeof item}} {{typeof i}}</span>
                </x-for>
                <span id="outside">{{typeof item}} {{typeof i}}</span>
            </x-app>
        `);
        const inside = drx.node('inside');
        const outside = drx.node('outside');
        {
            await inside.expect.toHaveText('function function');
            await outside.expect.toHaveText('undefined undefined');
        }
    });
});
