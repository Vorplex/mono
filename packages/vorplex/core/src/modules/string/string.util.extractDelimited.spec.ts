import { $String } from './string.util';

describe($String.matchDelimited.name, () => {
    function test(
        message: string,
        text: string,
        delimiters: readonly [string, string],
        expected: { type: 'text' | 'match'; value: string }[]
    ) {
        it(message, () => {
            expect($String.matchDelimited(text, delimiters)).toEqual(expected);
        });
    }

    test('should return an empty array for an empty string', '', ['{{', '}}'], []);

    test('should return a single text token when there are no delimiters', 'hello world', ['{{', '}}'], [
        { type: 'text', value: 'hello world' },
    ]);

    test('should treat a stray closing delimiter with no matching open as plain text', 'hello }} world', ['{{', '}}'], [
        { type: 'text', value: 'hello }} world' },
    ]);

    test('should extract a match with no surrounding text', '{{ a }}', ['{{', '}}'], [
        { type: 'match', value: ' a ' },
    ]);

    test('should extract text before and after a match', 'before {{ a }} after', ['{{', '}}'], [
        { type: 'text', value: 'before ' },
        { type: 'match', value: ' a ' },
        { type: 'text', value: ' after' },
    ]);

    test('should extract multiple matches separated by text', '{{ a }}-{{ b }}', ['{{', '}}'], [
        { type: 'match', value: ' a ' },
        { type: 'text', value: '-' },
        { type: 'match', value: ' b ' },
    ]);

    test('should not prematurely close on a single nested brace pair', '{{ { name: "" } }}', ['{{', '}}'], [
        { type: 'match', value: ' { name: "" } ' },
    ]);

    test('should not prematurely close when two single-brace pairs end adjacent to each other', '{{ {a: {b: 1}} }}', ['{{', '}}'], [
        { type: 'match', value: ' {a: {b: 1}} ' },
    ]);

    test('should not prematurely close when nested braces sit flush against the closing delimiter', '{{ {a: {b: 1}}}}', ['{{', '}}'], [
        { type: 'match', value: ' {a: {b: 1}}' },
    ]);

    test('should keep depth balanced across sibling single-brace groups', '{{ {a: 1} {b: 2} }}', ['{{', '}}'], [
        { type: 'match', value: ' {a: 1} {b: 2} ' },
    ]);

    test('should support a literal nested occurrence of the delimiter itself', '{{ {{ inner }} }}', ['{{', '}}'], [
        { type: 'match', value: ' {{ inner }} ' },
    ]);

    test('should support delimiters longer than two characters', 'x <<< a b >>> y', ['<<<', '>>>'], [
        { type: 'text', value: 'x ' },
        { type: 'match', value: ' a b ' },
        { type: 'text', value: ' y' },
    ]);

    test('should track nesting depth for delimiters other than curly braces', 'x (( f(g(x)) )) y', ['((', '))'], [
        { type: 'text', value: 'x ' },
        { type: 'match', value: ' f(g(x)) ' },
        { type: 'text', value: ' y' },
    ]);

    test('should not skip quoted content when quotes are not configured (default)', '{{ "a}}b" }}', ['{{', '}}'], [
        { type: 'match', value: ' "a' },
        { type: 'text', value: 'b" }}' },
    ]);

    it('should throw when the open delimiter is empty', () => {
        expect(() => $String.matchDelimited('{{ a }}', ['', '}}'])).toThrow();
    });

    it('should throw when the close delimiter is empty', () => {
        expect(() => $String.matchDelimited('{{ a }}', ['{{', ''])).toThrow();
    });

    it('should throw when the closing delimiter is missing entirely', () => {
        expect(() => $String.matchDelimited('{{ a', ['{{', '}}'])).toThrow();
    });

    it('should throw when brace depth never returns to balanced before the end of the text', () => {
        expect(() => $String.matchDelimited('{{ a } }}', ['{{', '}}'])).toThrow();
    });

    test(
        'should support mixed balanced delimiter characters',
        'x {[ a [b] {c} ]} y',
        ['{[', ']}'],
        [
            { type: 'text', value: 'x ' },
            { type: 'match', value: ' a [b] {c} ' },
            { type: 'text', value: ' y' },
        ],
    );

    test(
        'should support nested mixed delimiters',
        '{[ {[ inner ]} ]}',
        ['{[', ']}'],
        [
            { type: 'match', value: ' {[ inner ]} ' },
        ],
    );

    describe('same delimiter for open and close', () => {
        test('should treat the next occurrence as the close, with no nesting', '"a"', ['"', '"'], [
            { type: 'match', value: 'a' },
        ]);

        test('should extract multiple matches separated by text', 'x "a" y "b" z', ['"', '"'], [
            { type: 'text', value: 'x ' },
            { type: 'match', value: 'a' },
            { type: 'text', value: ' y ' },
            { type: 'match', value: 'b' },
            { type: 'text', value: ' z' },
        ]);

        it('should throw when the closing delimiter is missing', () => {
            expect(() => $String.matchDelimited('"a', ['"', '"'])).toThrow();
        });
    });

    describe('escaping', () => {
        it('should treat an escaped open as literal text, with the backslash stripped', () => {
            expect($String.matchDelimited('\\{{ a }}', ['{{', '}}'])).toEqual([
                { type: 'text', value: '{{ a }}' },
            ]);
        });

        it('should treat an escaped close as literal and keep scanning for a real one', () => {
            expect($String.matchDelimited('{{ a \\}} b }}', ['{{', '}}'])).toEqual([
                { type: 'match', value: ' a }} b ' },
            ]);
        });

        it('should support an escaped same-character delimiter', () => {
            expect($String.matchDelimited('say \\"hi\\" for real', ['"', '"'])).toEqual([
                { type: 'text', value: 'say "hi" for real' },
            ]);
        });

        it('should not exempt a nesting-capable open just because it sits inside an already-open match -- an escape unconditionally strips a delimiter\'s meaning, so the outer match closes on the next real close and a now-unmatched close is left as stray text, same as anywhere else', () => {
            expect($String.matchDelimited('{ \\{ test } }', ['{', '}'])).toEqual([
                { type: 'match', value: ' { test ' },
                { type: 'text', value: ' }' },
            ]);
        });

        it('should apply the same unconditional rule regardless of which characters the delimiters use', () => {
            expect($String.matchDelimited('( a \\( b ) c )', ['(', ')'])).toEqual([
                { type: 'match', value: ' a ( b ' },
                { type: 'text', value: ' c )' },
            ]);
        });
    });
});
