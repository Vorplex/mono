import { $Changes } from './changes.util';

describe($Changes.compareChanges.name, () => {
    function test(message, changesA, changesB, expected) {
        it(message, () => {
            const result = $Changes.compareChanges(changesA, changesB);
            expect(result).toEqual(expected);
        });
    }

    test(
        'should compare changes',
        { similarity: 1, conflict: 'a' },
        { difference: 0, similarity: 1, conflict: 'b' },
        { similarities: { similarity: 1 }, conflicts: { conflict: 'b' }, differences: { difference: 0 } }
    );
    test(
        'should compare array changes',
        { $0: { x: 0 } },
        { $0: { x: 1 } },
        { similarities: undefined, conflicts: { $0: { x: 1 } }, differences: undefined }
    );
    test(
        'should compare equal changes',
        { $0: { x: 0 } },
        { $0: { x: 0 } },
        { similarities: { $0: { x: 0 } }, conflicts: undefined, differences: undefined }
    );
});
