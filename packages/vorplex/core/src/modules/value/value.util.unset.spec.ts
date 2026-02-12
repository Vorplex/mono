import { $Value } from './value.util';

describe($Value.unset.name, () => {
    it('should unset property of object', () => {
        const target = {
            name: 'foo',
        };
        $Value.unset(target, 'name');
        expect('name' in target).toBeFalsy();
    });
});
