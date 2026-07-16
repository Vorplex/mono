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
    // string patches — must be treated as atomic, not decomposed index-by-index
    test('should return similarities for equal string patches', [4, 9, 'slow'], [4, 9, 'slow'], { differences: undefined, similarities: [4, 9, 'slow'], conflicts: undefined });
    test('should return the whole patch as a conflict for unequal string patches, not per-index', [4, 9, 'slow'], [2, 9, 'fast'], { differences: undefined, similarities: undefined, conflicts: [4, 9, 'slow'] });
    test('should return conflict when a string patch is compared against a full string replacement', [4, 9, 'slow'], 'The slow brown fox and more', { differences: undefined, similarities: undefined, conflicts: [4, 9, 'slow'] });
    test('should treat a nested string patch as an atomic conflict', { title: [4, 9, 'slow'] }, { title: [2, 9, 'fast'] }, { differences: undefined, similarities: undefined, conflicts: { title: [4, 9, 'slow'] } });
    test('should return similarities for equal multi-hunk string patches', [[27, 31, 'Alex'], [88, 95, 'launch']], [[27, 31, 'Alex'], [88, 95, 'launch']], { differences: undefined, similarities: [[27, 31, 'Alex'], [88, 95, 'launch']], conflicts: undefined });
    test('should return the whole multi-hunk patch as a conflict, not per-hunk', [[27, 31, 'Alex'], [88, 95, 'launch']], [[27, 31, 'Sam'], [88, 95, 'launch']], { differences: undefined, similarities: undefined, conflicts: [[27, 31, 'Alex'], [88, 95, 'launch']] });
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
    // array insert keys ($N+)
    test('should treat equal array inserts as similarity', { '$1+': { id: 'a', type: 'x' } }, { '$1+': { id: 'a', type: 'x' } }, { differences: undefined, similarities: { '$1+': { id: 'a', type: 'x' } }, conflicts: undefined });
    test('should treat unequal array inserts as difference not conflict', { '$1+': { id: 'a', type: 'x' } }, { '$1+': { id: 'b', type: 'x' } }, { differences: { '$1+': { id: 'a', type: 'x' } }, similarities: undefined, conflicts: undefined });
    test('should treat array insert only in `a` as difference', { '$1+': { id: 'a' } }, {}, { differences: { '$1+': { id: 'a' } }, similarities: undefined, conflicts: undefined });
});
