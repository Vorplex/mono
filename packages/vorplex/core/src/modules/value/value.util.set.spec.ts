import { $Value } from './value.util';

describe($Value.set.name, () => {
    it('should set property of object', () => {
        const target = {
            name: 'foo',
        };
        $Value.set(target, 'name', 'bar');
        expect(target.name).toEqual('bar');
    });
    it('should set property of nested object', () => {
        const target = {
            child: {
                name: 'foo',
            },
        };
        $Value.set(target, 'child.name', 'bar');
        expect(target.child.name).toEqual('bar');
    });
    it('should set item of array', () => {
        const target = {
            child: {
                items: ['test'],
            },
        };
        $Value.set(target, 'child.items[0]', 0);
        expect(target.child.items[0]).toEqual(0);
        $Value.set(target, 'child.items[1]', 1);
        expect(target.child.items[1]).toEqual(1);
    });
});
