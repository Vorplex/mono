import { $StringPatch } from './string-patch.util';

describe($StringPatch.diff.name, () => {
    function test(message, base, target, change) {
        it(message, () => {
            expect($StringPatch.diff(base, target)).toEqual(change);
        });
    }

    test('should return the target when strings are equal', 'same', 'same', 'same');
    test('should return a hunk for a localized edit', 'The quick brown fox', 'The slow brown fox', [4, 9, 'slow']);
    test('should return a hunk for a pure insertion', 'Hello there', 'Hello there, welcome to the team!', [11, 11, ', welcome to the team!']);
    test('should return a hunk for a pure deletion', 'Hello there, welcome to the team!', 'Hello there!', [11, 32, '']);
    test('should return the target when a hunk would not serialize smaller', 'cat', 'cats', 'cats');
    test('should return the target when base is empty', '', 'hello', 'hello');
    test('should return the target when target is empty', 'hello', '', '');
    test('should return multiple hunks for edits far apart in a longer string', 'The report was reviewed by John Smith on Monday and approved by Jane Doe on Tuesday for release', 'The report was reviewed by Alex Smith on Monday and approved by Jane Doe on Tuesday for launch', [[27, 31, 'Alex'], [88, 95, 'launch']]);
    // surrogate pairs — offsets must stay in UTF-16 code units without splitting a pair
    test('should keep a surrogate pair intact when the character changes', 'I feel 😀 today', 'I feel 😢 today', [7, 9, '😢']);
    test('should keep surrogate pairs intact on insertion', 'Great job', 'Great job 🎉🎉🎉', [9, 9, ' 🎉🎉🎉']);
    // JSON-sensitive characters in the inserted text
    test('should handle quotes in the inserted text', 'He said hi', 'He said "hi there"', [8, 10, '"hi there"']);
    test('should handle backslashes in the inserted text', 'path is C:\\old', 'path is C:\\new\\deep', [11, 14, 'new\\deep']);

    it('should diff by line once a string exceeds the character guard', () => {
        const lines = Array.from({ length: 30 }, (_, i) => `function handler${i}() { return ${i}; }`);
        const base = lines.join('\n');
        const targetLines = [...lines];
        targetLines[1] = 'function handler1() { return 100; }';
        targetLines[28] = 'function handler28() { return 2800; }';
        const target = targetLines.join('\n');
        expect($StringPatch.diff(base, target)).toEqual([
            [34, 68, 'function handler1() { return 100; }\n'],
            [988, 1024, 'function handler28() { return 2800; }\n'],
        ]);
    });

    describe('line-tokenized diffing', () => {
        const pad = ' ' + 'x'.repeat(60); // pushes total length past the character guard
        const padded = (lines: string[]) => lines.map((line) => line + pad).join('\n');

        it('should insert a new line at the very start', () => {
            expect($StringPatch.diff(padded(['a', 'b', 'c']), padded(['NEW', 'a', 'b', 'c']))).toEqual([0, 0, `NEW${pad}\n`]);
        });
        it('should insert a new line at the very end', () => {
            expect($StringPatch.diff(padded(['a', 'b', 'c']), padded(['a', 'b', 'c', 'NEW']))).toEqual([188, 188, `\nNEW${pad}`]);
        });
        it('should delete the first line', () => {
            expect($StringPatch.diff(padded(['a', 'b', 'c']), padded(['b', 'c']))).toEqual([0, 63, '']);
        });
        it('should delete the last line', () => {
            expect($StringPatch.diff(padded(['a', 'b', 'c']), padded(['a', 'b']))).toEqual([64, 127, '']);
        });
        it('should add a trailing newline', () => {
            expect($StringPatch.diff(padded(['a', 'b']), padded(['a', 'b']) + '\n')).toEqual([125, 125, '\n']);
        });
        it('should remove a trailing newline', () => {
            expect($StringPatch.diff(padded(['a', 'b']) + '\n', padded(['a', 'b']))).toEqual([125, 126, '']);
        });
        it('should return the target when all multi-line content is deleted', () => {
            expect($StringPatch.diff(padded(['a', 'b', 'c']), '')).toEqual('');
        });
    });
});
