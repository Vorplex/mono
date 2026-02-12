import { $Changes } from './changes.util';

describe($Changes.excludeChanges.name, () => {
    function test(message, changes, paths, result) {
        it(message, () => {
            const output = $Changes.excludeChanges(changes, paths);
            expect(output).toEqual(result);
        });
    }

    // basic exclusion
    test('should return original changes when no paths to exclude', { user: { name: 'Alice', age: 30 } }, [], { user: { name: 'Alice', age: 30 } });
    test('should remove single path', { user: { name: 'Alice', age: 30 } }, ['user.name'], { user: { age: 30 } });
    test('should remove multiple paths', { user: { name: 'Alice', age: 30, email: 'a@b.com' } }, ['user.name', 'user.email'], { user: { age: 30 } });

    // empty object cleanup
    test('should clean up empty object when all properties removed', { user: { name: 'Alice', age: 30 } }, ['user.name', 'user.age'], undefined);
    test('should preserve intentional empty object change', { config: {} }, [], { config: {} });
    test('should clean up nested empty objects', { a: { b: { c: { d: 'value' } } } }, ['a.b.c.d'], undefined);
    test('should clean up partial nested empty objects', { a: { b: { c: 'value' } }, x: { y: { z: 'keep' } } }, ['a.b.c'], { x: { y: { z: 'keep' } } });

    // array index changes - inserts
    test('should remove array insert when all properties removed', { nodeIds: { '$1+': { name: 'Node', type: 'Box' } } }, ['nodeIds.$1+.name', 'nodeIds.$1+.type'], undefined);
    test('should keep array insert when some properties remain', { nodeIds: { '$1+': { name: 'Node', type: 'Box' } } }, ['nodeIds.$1+.name'], { nodeIds: { '$1+': { type: 'Box' } } });
    test('should preserve intentional empty object insert', { items: { '$0+': {} } }, [], { items: { '$0+': {} } });

    // array index changes - deletes
    test('should preserve array delete operations', { items: { $0: $Changes.deleted, $1: { name: 'Item' } } }, ['items.$1.name'], { items: { $0: $Changes.deleted } });

    // array index changes - updates
    test('should keep array update when properties remain', { items: { $0: { name: 'Updated', count: 5 } } }, ['items.$0.name'], { items: { $0: { count: 5 } } });
    test('should remove array update when all properties removed', { items: { $0: { name: 'Updated' } } }, ['items.$0.name'], undefined);

    // deleted property handling
    test('should preserve deleted markers', { user: { name: 'Alice', age: $Changes.deleted } }, ['user.name'], { user: { age: $Changes.deleted } });
    test('should keep object with only deleted markers', { user: { name: $Changes.deleted, age: $Changes.deleted } }, [], { user: { name: $Changes.deleted, age: $Changes.deleted } });
    test('should preserve deleted marker in array changes', { items: { $0: $Changes.deleted, '$1+': { value: 'new' } } }, ['items.$1+.value'], { items: { $0: $Changes.deleted } });

    // complex scenarios
    test('should handle complex nested structure', { user: { profile: { name: 'Alice', bio: 'Dev' }, settings: { theme: 'dark', lang: 'en' } }, posts: { '$0+': { title: 'Hello', content: 'World' } } }, ['user.profile.name', 'posts.$0+.content'], { user: { profile: { bio: 'Dev' }, settings: { theme: 'dark', lang: 'en' } }, posts: { '$0+': { title: 'Hello' } } });
    test('should handle removal of entire branches', { a: { x: 1, y: 2 }, b: { x: 1, y: 2 }, c: { x: 1 } }, ['a.x', 'a.y', 'b.x'], { b: { y: 2 }, c: { x: 1 } });
    test('should handle array with mixed operations', { items: { $0: { name: 'Updated', status: 'active' }, $1: $Changes.deleted, '$2+': { name: 'New', status: 'pending' } } }, ['items.$0.name', 'items.$2+.status'], { items: { $0: { status: 'active' }, $1: $Changes.deleted, '$2+': { name: 'New' } } });

    // edge cases
    test('should handle undefined changes', undefined, ['some.path'], undefined);
    test('should handle null changes', null, ['some.path'], null);
    test('should handle non-existent paths', { user: { name: 'Alice' } }, ['user.nonexistent', 'other.path'], { user: { name: 'Alice' } });
    test('should handle primitive value removal', { value: 42 }, ['value'], undefined);

    // edge cases from discussion
    test('empty changes object with no paths', {}, [], {});
    test('empty changes object with paths', {}, ['any.path'], {});
    test('change to array value', [1, 2, 3], ['any.path'], [1, 2, 3]);
    test('change to string value', 'hello', ['any.path'], 'hello');
    test('change to number value', 42, ['any.path'], 42);
    test('change to boolean value', true, ['any.path'], true);
    test('nested empty cleanup', { a: { b: { c: { d: 'value' } } } }, ['a.b.c.d'], undefined);
    test('preserve intentional empty nested', { a: { b: {} } }, [], { a: { b: {} } });
    test('cleanup empty after exclusion but preserve sibling', { a: { b: { c: 'x' } }, d: 'y' }, ['a.b.c'], { d: 'y' });
});

