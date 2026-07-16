import { $StringPatch } from './string-patch.util';

describe($StringPatch.apply.name, () => {
    function test(message, base, change, result) {
        it(message, () => {
            expect($StringPatch.apply(base, change)).toEqual(result);
        });
    }

    test('should apply a single hunk', 'The quick brown fox', [4, 9, 'slow'], 'The slow brown fox');
    test('should apply an insertion hunk', 'Hello there', [11, 11, ', welcome to the team!'], 'Hello there, welcome to the team!');
    test('should apply a deletion hunk', 'Hello there, welcome to the team!', [11, 32, ''], 'Hello there!');
    test('should apply multiple non-overlapping hunks left to right', '0123456789', [[1, 2, 'A'], [4, 5, 'B'], [8, 9, 'C']], '0A23B567C9');
    test('should return the change directly when it is a full string replacement', 'old value', 'new value', 'new value');
    // surrogate pairs — reconstruction must not leave a lone surrogate behind
    test('should reconstruct a surrogate pair correctly', 'I feel 😀 today', [7, 9, '😢'], 'I feel 😢 today');
    // JSON-sensitive characters in the inserted text
    test('should reconstruct quotes in the inserted text', 'He said hi', [8, 10, '"hi there"'], 'He said "hi there"');
    test('should reconstruct backslashes in the inserted text', 'path is C:\\old', [11, 14, 'new\\deep'], 'path is C:\\new\\deep');

    it('should apply a line-tokenized hunk that spans a deleted first line', () => {
        const pad = ' ' + 'x'.repeat(60);
        const padded = (lines: string[]) => lines.map((line) => line + pad).join('\n');
        expect($StringPatch.apply(padded(['a', 'b', 'c']), [0, 63, ''])).toEqual(padded(['b', 'c']));
    });

    it('should throw when hunks are out of order', () => {
        expect(() => $StringPatch.apply('abcdefghij', [[5, 6, 'Z'], [1, 2, 'Y']])).toThrow('String change out of bounds');
    });
    it('should throw when a hunk is out of bounds', () => {
        expect(() => $StringPatch.apply('cat', [0, 10, 'x'])).toThrow('String change out of bounds');
    });
});
