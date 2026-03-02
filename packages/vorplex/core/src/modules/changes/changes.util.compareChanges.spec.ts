import { $Changes } from './changes.util';

describe($Changes.compareChanges.name, () => {
    function test(message, a, b, expected) {
        it(message, () => {
            expect($Changes.compareChanges(a, b)).toEqual(expected);
        });
    }

    // undefined inputs
    test('should return all undefined when both are undefined', undefined, undefined, { differences: undefined, similarities: undefined, conflicts: undefined });
    test('should return all undefined when a is undefined', undefined, { a: 1 }, { differences: undefined, similarities: undefined, conflicts: undefined });
    test('should return a as difference when b is undefined', { a: 1 }, undefined, { differences: { a: 1 }, similarities: undefined, conflicts: undefined });
    // primitives
    test('should return similarities for equal primitives', 'x', 'x', { differences: undefined, similarities: 'x', conflicts: undefined });
    test('should return conflict for unequal primitives', 'x', 'y', { differences: undefined, similarities: undefined, conflicts: 'x' });
    // type mismatches
    test('should return conflict when b is primitive and a is object', { a: 1 }, 'x', { differences: undefined, similarities: undefined, conflicts: { a: 1 } });
    test('should return conflict when array type differs', { a: 1 }, [1, 2], { differences: undefined, similarities: undefined, conflicts: { a: 1 } });
    // object
    test('should return difference for key only in a', { a: 1, b: 2 }, { b: 2 }, { differences: { a: 1 }, similarities: { b: 2 }, conflicts: undefined });
    test('should ignore key only in b', { a: 1 }, { a: 1, b: 2 }, { differences: undefined, similarities: { a: 1 }, conflicts: undefined });
    test('should return similarities for equal object values', { a: 1 }, { a: 1 }, { differences: undefined, similarities: { a: 1 }, conflicts: undefined });
    test('should return conflict for unequal object values', { a: 1 }, { a: 2 }, { differences: undefined, similarities: undefined, conflicts: { a: 1 } });
    test('should recurse into nested objects', { x: { a: 1 } }, { x: { a: 2 } }, { differences: undefined, similarities: undefined, conflicts: { x: { a: 1 } } });
    test('should split into all three buckets', { similarity: 1, conflict: 'a', difference: 2 }, { similarity: 1, conflict: 'b' }, { differences: { difference: 2 }, similarities: { similarity: 1 }, conflicts: { conflict: 'a' } });
});
