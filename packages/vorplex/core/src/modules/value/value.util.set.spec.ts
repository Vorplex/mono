import { $Value } from './value.util';

describe($Value.set.name, () => {
    it('should set property of object', () => {
        const target = {
            name: 'foo',
        };
        const result = $Value.set(target, 'name', 'bar');

        expect(result.name).toEqual('bar');
        expect(target.name).toEqual('foo');
    });

    it('should set property of nested object', () => {
        const target = {
            child: {
                name: 'foo',
            },
        };
        const result = $Value.set(target, 'child.name', 'bar');

        expect(result.child.name).toEqual('bar');
        expect(target.child.name).toEqual('foo');
        expect(result.child).not.toBe(target.child);
    });

    it('should set item of array', () => {
        const target = {
            child: {
                items: ['test'],
            },
        };
        const first = $Value.set(target, 'child.items[0]', 0);
        const second = $Value.set(first, 'child.items[1]', 1);

        expect(second.child.items[0]).toEqual(0);
        expect(second.child.items[1]).toEqual(1);
        expect(target.child.items[0]).toEqual('test');
    });

    it('should set root value', () => {
        const target = {
            name: 'foo',
        };
        const result = $Value.set(target, value => ({
            ...value,
            name: 'bar'
        }));

        expect(result.name).toEqual('bar');
        expect(target.name).toEqual('foo');
    });

    it('should set root selector value', () => {
        const target = {
            name: 'foo',
        };
        const result = $Value.set(target, value => value, value => ({
            ...value,
            name: 'bar'
        }));

        expect(result.name).toEqual('bar');
        expect(target.name).toEqual('foo');
    });
});
