import { $Changes } from './changes.util';

describe($Changes.apply.name, () => {
    function test(message, a, changes, result) {
        it(message, () => {
            const b = $Changes.apply(a, changes);
            expect(b).toEqual(result);
        });
    }

    // value
    test('should return value if changes undefined', 'a', undefined, 'a');
    test('should return null value if changed to null', 'a', null, null);
    test('should return changes if different from value', 'a', 'b', 'b');
    test('should return changes value is an object and changes is a primitive', { property: undefined }, 0, 0);
    test('should return changes value is an object and changes is an array', { property: undefined }, [], []);
    // object
    test('should return object with updated property', { name: 'foo', age: 23 }, { name: 'bar' }, { name: 'bar', age: 23 });
    test('should return object with deleted property', { name: 'foo', age: 23 }, { age: $Changes.deleted }, { name: 'foo' });
    test('should return object with added property', { name: 'foo' }, { age: 23 }, { name: 'foo', age: 23 });
    test('should return object with added property', { }, { property: {} }, { property: {} });
    test('should return object with added property', { property: undefined }, { property: {} }, { property: {} });
    // array
    test('should return array with appended item', [0, 1], { '$2+': 2 }, [0, 1, 2]);
    test('should return array with prepended item', [1, 2], { '$0+': 0 }, [0, 1, 2]);
    test('should return array with inserted item', [0, 2], { '$1+': 1 }, [0, 1, 2]);
    test('should return array with inserted item', [0, 1, 3, 4], { '$2+': 2 }, [0, 1, 2, 3, 4]);
    test('should return array with removed item', [0, 1, 2], { $2: $Changes.deleted }, [0, 1]);
    test('should return array with value', [0, 1], [2, 3], [2, 3]);
    // object array
    test('should return array with removed object', [{ i: 0, x: 'a' }, { i: 1, x: 'b' }, { i: 2, x: 'c' }], { $1: $Changes.deleted }, [{ i: 0, x: 'a' }, { i: 2, x: 'c' }]);
    test('should return array with inserted object', [{ i: 1, x: 'b' }, { i: 2, x: 'c' }], { '$0+': { i: 0, x: 'a' } }, [{ i: 0, x: 'a' }, { i: 1, x: 'b' }, { i: 2, x: 'c' }]);
    test('should return array with updated object', [{ i: 0, x: 'a' }, { i: 1, x: 'b' }, { i: 2, x: 'c' }], { $0: { x: 'x' } }, [{ i: 0, x: 'x' }, { i: 1, x: 'b' }, { i: 2, x: 'c' }]);
    // nested object
    test('should return nested object with updated property', { gender: 'male', child: { name: 'foo' } }, { child: { name: 'bar' } }, { gender: 'male', child: { name: 'bar' } });
    test('should return nested object with added property', { gender: 'male', child: { name: 'foo' } }, { child: { age: 23 } }, { gender: 'male', child: { name: 'foo', age: 23 } });
    test('should return nested object with deleted property', { gender: 'male', child: { name: 'foo' } }, { child: { name: $Changes.deleted } }, { gender: 'male', child: {} });
});
