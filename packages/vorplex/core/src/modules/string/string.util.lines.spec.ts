import { $String } from './string.util';

describe($String.lines.name, () => {
    function test(message: string, string: string, expected: string[]) {
        it(message, () => {
            expect($String.lines(string)).toEqual(expected);
        });
    }

    test('should return a single empty line for an empty string', '', ['']);
    test('should split on new lines', 'a\nb\nc', ['a', 'b', 'c']);
    test('should ignore a single trailing new line', 'a\nb\n', ['a', 'b']);
    test('should keep empty lines before the trailing new line', 'a\n\n', ['a', '']);
    test('should keep a lone new line as one empty line', '\n', ['']);
});
