import { $Changes } from './changes.util';

describe($Changes.classifyPathsByOverlap.name, () => {
    function test(message, changesA, changesB, expected) {
        it(message, () => {
            const result = $Changes.classifyPathsByOverlap(changesA, changesB);
            expect(result).toEqual(expected);
        });
    }

    test('should classify paths with overlaps', { a: 'a', b: 'b' }, { b: 'b', c: 'c' }, { conflicts: ['b'], differences: ['a', 'c'] });
});

describe($Changes.resolveConflicts.name, () => {
    function test(message, changesA, changesB, expected) {
        it(message, () => {
            const result = $Changes.resolveConflicts(changesA, changesB);
            expect(result).toEqual(expected);
        });
    }

    test('should separate conflicting and non-conflicting changes', { a: 'a', b: 'b' }, { b: 'b', c: 'c' }, { conflicts: { b: 'b' }, differences: { c: 'c' } });
    test('should separate conflicting and non-conflicting changes', { $0: { x: 0 } }, { $0: { x: 1 } }, { conflicts: { $0: { x: 1 } }, differences: undefined });
    // test('should handle no conflicts', { user: { name: 'Alice' } }, { settings: { theme: 'dark' } }, { conflict: undefined, alignment: { settings: { theme: 'dark' } } });
    // test('should handle all conflicts', { user: { name: 'Alice' } }, { user: { age: 30 } }, { conflict: { user: { age: 30 } }, alignment: undefined });
});
