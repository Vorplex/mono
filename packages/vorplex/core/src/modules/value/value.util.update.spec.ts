import { $Value } from './value.util';

describe($Value.update.name, () => {
    function test<T extends object, V>(message: string, original: T, path: (obj: T) => V, valueOrUpdater: V | ((current: V) => V), expected: any) {
        it(message, () => {
            const result = $Value.update(original, path, valueOrUpdater);
            expect(path(result)).toEqual(expected);
        });
    }

    // direct value updates
    test('should update top-level property', { name: 'a' }, o => o.name, 'b', 'b');
    test('should update nested property', { child: { name: 'a' } }, o => o.child.name, 'b', 'b');
    test('should update array element', { items: ['a', 'b'] }, o => o.items[0], 'x', 'x');
    test('should update deeply nested property', { a: { b: { c: 'd' } } }, o => o.a.b.c, 'e', 'e');

    // updater function
    test('should increment number', { count: 5 }, o => o.count, n => n + 1, 6);
    test('should append to array', { items: ['a'] }, o => o.items, arr => [...arr, 'b'], ['a', 'b']);
    test('should double nested value', { child: { val: 10 } }, o => o.child.val, v => v * 2, 20);

    // immutability
    it('should return new root reference', () => {
        const original = { name: 'a' };
        const result = $Value.update(original, o => o.name, 'b');
        expect(result).not.toBe(original);
    });

    it('should break references along path', () => {
        const original = { child: { name: 'a' } };
        const result = $Value.update(original, o => o.child.name, 'b');
        expect(result.child).not.toBe(original.child);
    });

    it('should preserve untouched branch references', () => {
        const original = { touched: { a: 1 }, untouched: { b: 2 } };
        const result = $Value.update(original, o => o.touched.a, 9);
        expect(result.untouched).toBe(original.untouched);
    });

    it('should not mutate original', () => {
        const original = { name: 'a' };
        $Value.update(original, o => o.name, 'b');
        expect(original.name).toBe('a');
    });

    // auto-create paths
    test('should create missing objects', {} as any, o => o.a.b.c, 'x', 'x');
    test('should create array for numeric key', {} as any, o => o.items[0], 'x', 'x');

    it('should create array container for numeric key', () => {
        const result = $Value.update({} as { items: string[] }, o => o.items[0], 'x');
        expect(Array.isArray(result.items)).toBe(true);
    });
});
