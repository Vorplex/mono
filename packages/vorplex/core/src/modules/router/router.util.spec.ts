import { $Router, type RouteParameter } from './router.util';

describe($Router.name, () => {
    describe($Router.getParameters.name, () => {
        function test(args: { it: string; pattern: string; expected: RouteParameter[] }) {
            it(args.it, () => {
                const parameters = $Router.getParameters(args.pattern);
                expect(parameters).toEqual(args.expected);
            });
        }
        test({
            it: 'should return no parameters',
            pattern: 'api/info',
            expected: [],
        });
        test({
            it: 'should return required parameter',
            pattern: 'api/{id}',
            expected: [
                {
                    name: 'id',
                    optional: false,
                    rest: false,
                },
            ],
        });
        test({
            it: 'should return optional parameter',
            pattern: 'api/{id?}',
            expected: [
                {
                    name: 'id',
                    optional: true,
                    rest: false,
                },
            ],
        });
        test({
            it: 'should return rest parameter',
            pattern: 'api/{...rest}',
            expected: [
                {
                    name: 'rest',
                    optional: false,
                    rest: true,
                },
            ],
        });
        test({
            it: 'should return multiple parameters',
            pattern: 'todo/{id}/{action?}/{...rest}',
            expected: [
                {
                    name: 'id',
                    optional: false,
                    rest: false,
                },
                {
                    name: 'action',
                    optional: true,
                    rest: false,
                },
                {
                    name: 'rest',
                    optional: false,
                    rest: true,
                },
            ],
        });
    });

    describe($Router.match.name, () => {
        function test(args: { it: string; pattern: string; value: string; expected: Record<string, string> }) {
            const result = $Router.match(args.pattern, args.value);
            expect(result).toEqual(args.expected);
        }

        test({
            it: 'should match pattern exactly',
            pattern: 'api/info',
            value: 'api/info',
            expected: {},
        });
        test({
            it: 'should match pattern with optional slash',
            pattern: 'api/info/?',
            value: 'api/info',
            expected: {},
        });
        test({
            it: 'should match pattern with parameter',
            pattern: 'api/info/{id}',
            value: 'api/info/param1',
            expected: {
                id: 'param1',
            },
        });
        test({
            it: 'should match pattern with optional parameter',
            pattern: 'api/info/{id?}',
            value: 'api/info/',
            expected: {
                id: '',
            },
        });
    });
});
