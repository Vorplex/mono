import { $Array } from './array.util';

describe($Array.diff.name, () => {
    function test(message, base, target, operations) {
        it(message, () => {
            expect($Array.diff(base, target)).toEqual(operations);
        });
    }

    test('should return only keep operations for equal arrays', [0, 1, 2], [0, 1, 2], [
        { type: 'keep', sourceIndex: 0, targetIndex: 0 },
        { type: 'keep', sourceIndex: 1, targetIndex: 1 },
        { type: 'keep', sourceIndex: 2, targetIndex: 2 },
    ]);
    test('should return an insert for an appended item', [0, 1], [0, 1, 2], [
        { type: 'keep', sourceIndex: 0, targetIndex: 0 },
        { type: 'keep', sourceIndex: 1, targetIndex: 1 },
        { type: 'insert', targetIndex: 2, value: 2 },
    ]);
    test('should return an insert for a prepended item', [1, 2], [0, 1, 2], [
        { type: 'insert', targetIndex: 0, value: 0 },
        { type: 'keep', sourceIndex: 0, targetIndex: 1 },
        { type: 'keep', sourceIndex: 1, targetIndex: 2 },
    ]);
    test('should return a delete for a removed item', [0, 1, 2], [0, 2], [
        { type: 'keep', sourceIndex: 0, targetIndex: 0 },
        { type: 'delete', sourceIndex: 1 },
        { type: 'keep', sourceIndex: 2, targetIndex: 1 },
    ]);
    test('should return a delete and insert for a replaced item', [0, 1, 2], [0, 9, 2], [
        { type: 'keep', sourceIndex: 0, targetIndex: 0 },
        { type: 'delete', sourceIndex: 1 },
        { type: 'insert', targetIndex: 1, value: 9 },
        { type: 'keep', sourceIndex: 2, targetIndex: 2 },
    ]);
    test('should return no operations for two empty arrays', [], [], []);
    test('should return only inserts when base is empty', [], [0, 1], [
        { type: 'insert', targetIndex: 0, value: 0 },
        { type: 'insert', targetIndex: 1, value: 1 },
    ]);
    test('should return only deletes when target is empty', [0, 1], [], [
        { type: 'delete', sourceIndex: 0 },
        { type: 'delete', sourceIndex: 1 },
    ]);
});
