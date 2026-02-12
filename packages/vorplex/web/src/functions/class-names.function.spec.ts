import { classNames } from './class-names.function';

describe(classNames.name, () => {
    function test(args: { it: string; classNames: (string | Record<string, boolean>)[]; expected: string }) {
        it(args.it, () => {
            const classString = classNames(...args.classNames);
            expect(classString).toBe(args.expected);
        });
    }
    test({
        it: 'should return class',
        classNames: ['foo'],
        expected: 'foo',
    });
    test({
        it: 'should return classes',
        classNames: ['foo', 'bar'],
        expected: 'foo bar',
    });
    test({
        it: 'should return class if true',
        classNames: [{ foo: true }],
        expected: 'foo',
    });
    test({
        it: 'should not return class if false',
        classNames: [{ foo: false }],
        expected: '',
    });
});
