import { $Changes } from './changes.util';

describe($Changes.get.name, () => {
    function test(message, a, b, changes) {
        it(message, () => {
            const result = $Changes.get(a, b);
            expect(result).toEqual(changes);
        });
    }

    // value
    test('should return undefined if values are equal', 'a', 'a', undefined);
    test('should return null if change is null', 'a', null, null);
    test('should return new value if changed', 'a', 'b', 'b');
    test('should return new value if types are different', '1', 1, 1);
    // string patch
    test('should return a compact patch for a localized string edit', 'The quick brown fox', 'The slow brown fox', [4, 9, 'slow']);
    test('should return a patch for a pure insertion', 'Hello there', 'Hello there, welcome to the team!', [11, 11, ', welcome to the team!']);
    test('should return a patch for a pure deletion', 'Hello there, welcome to the team!', 'Hello there!', [11, 32, '']);
    test('should return the full string when a patch would not serialize smaller', 'cat', 'cats', 'cats');
    test('should return the full string when a is empty', '', 'hello', 'hello');
    test('should return the full string when b is empty', 'hello', '', '');
    test('should return a patch for a string property nested in an object', { title: 'Fix login bug', status: 'open' }, { title: 'Fix login timeout bug', status: 'closed' }, { title: [9, 9, ' timeout'], status: 'closed' });
    // multi-hunk string patch
    test('should return multiple hunks for edits far apart in a longer string', 'The report was reviewed by John Smith on Monday and approved by Jane Doe on Tuesday for release', 'The report was reviewed by Alex Smith on Monday and approved by Jane Doe on Tuesday for launch', [[27, 31, 'Alex'], [88, 95, 'launch']]);
    test('should merge hunks separated by a small shared gap into a single hunk', 'My name is Rudi', 'Her name is Jani', 'Her name is Jani');
    // object
    test('should only return changed property of object', { name: 'foo', age: 23 }, { name: 'bar', age: 23 }, { name: 'bar' });
    test('should only return added property of object', { name: 'foo' }, { name: 'foo', age: 23 }, { age: 23 });
    test('should only return deleted property of object', { name: 'foo', age: 23 }, { name: 'foo' }, { age: $Changes.deleted });
    test('should only return added property of object of type object', {}, { property: {} }, { property: {} });
    test('should only return changed property of object of type object', { property: undefined }, { property: {} }, { property: {} });
    test('should only return undefined for property of object of type object if no changes', { property: {} }, { property: {} }, undefined);
    test('should return return change when an array for objects', { '0': { property: null } }, [{ property: null }], [{ property: null }]);
    // nested object
    test('should only return changed property of nested object', { gender: 'male', child: { name: 'foo', age: 23 } }, { gender: 'male', child: { name: 'bar', age: 23 } }, { child: { name: 'bar' } });
    test('should only return added property of nested object', { gender: 'male', child: { name: 'foo' } }, { gender: 'male', child: { name: 'foo', age: 23 } }, { child: { age: 23 } });
    test('should only return deleted property of nested object', { gender: 'male', child: { name: 'foo', age: 23 } }, { gender: 'male', child: { name: 'foo' } }, { child: { age: $Changes.deleted } });
    // null base
    test('should return b when a is null', null, 'value', 'value');
    // array
    test('should return undefined if no changes to array', [0, 1, 2], [0, 1, 2], undefined);
    test('should return empty array when target array is empty', [1, 2], [], []);
    test('should return appended value to array', [0, 1], [0, 1, 2], { '$2+': 2 });
    test('should return prepended value to array', [1, 2], [0, 1, 2], { '$0+': 0 });
    test('should return inserted value to array', [0, 2], [0, 1, 2], { '$1+': 1 });
    test('should return inserted value to array', [0, 1, 3, 4], [0, 1, 2, 3, 4], { '$2+': 2 });
    test('should return inserted values to array', [0, 2], [0, 1, 2, 3], { '$1+': 1, '$3+': 3 });
    test('should return removed value from array', [0, 1, 2], [0, 2], { $1: $Changes.deleted });
    test('should return removed values from array', [0, 1, 2], [2], { $0: $Changes.deleted, $1: $Changes.deleted });
    // array object
    test('should return appended array object', [{ tag: 'a' }, { tag: 'b' }], [{ tag: 'a' }, { tag: 'b' }, { tag: 'c' }], { '$2+': { tag: 'c' } });
    test('should return replaced array object', [{ tag: 'a' }, { tag: 'b' }, { tag: 'c' }], [{ tag: 'a' }, { tag: 'f' }, { tag: 'c' }], { $1: $Changes.deleted, '$1+': { tag: 'f' } });
    test('should return deleted array object', [{ tag: 'a' }, { tag: 'b' }, { tag: 'c' }], [{ tag: 'a' }, { tag: 'c' }], { $1: $Changes.deleted });
    test('should return replaced array object at start', [{ i: 0, tag: 'a' }, { i: 1, tag: 'b' }], [{ i: 0, tag: 'c' }, { i: 1, tag: 'b' }], { $0: $Changes.deleted, '$0+': { i: 0, tag: 'c' } });
    // id-based array
    test('should delete item by id', [{ id: 0 }, { id: 1 }], [{ id: 1 }], { '${0}': $Changes.deleted });
    test('should update item by id', [{ id: 0, name: 'A' }, { id: 1, name: 'B' }], [{ id: 0, name: 'C' }, { id: 1, name: 'B' }], { '${0}': { name: 'C' } });
    test('should insert item by id', [{ id: 0 }, { id: 1 }], [{ id: 0 }, { id: 1 }, { id: 2 }], { '$2+': { id: 2 } });
    test('should return undefined for id-based array with no changes', [{ id: 0, name: 'A' }, { id: 1, name: 'B' }], [{ id: 0, name: 'A' }, { id: 1, name: 'B' }], undefined);
    test('should track update by id regardless of position', [{ id: 0, name: 'A' }, { id: 1, name: 'B' }], [{ id: 1, name: 'B' }, { id: 0, name: 'C' }], { '${0}': { name: 'C' } });
    test('should delete and update by id in same change', [{ id: 0, name: 'A' }, { id: 1, name: 'B' }, { id: 2, name: 'C' }], [{ id: 0, name: 'A' }, { id: 2, name: 'Z' }], { '${1}': $Changes.deleted, '${2}': { name: 'Z' } });
});
