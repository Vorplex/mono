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

    describe($Router.matchPrefix.name, () => {
        function test(args: { it: string; pattern: string; value: string; expected: { params: Record<string, string>; remaining: string } | null }) {
            it(args.it, () => {
                const result = $Router.matchPrefix(args.pattern, args.value);
                expect(result).toEqual(args.expected);
            });
        }

        test({
            it: 'root matches everything and consumes nothing',
            pattern: '/',
            value: '/posts/edit/5',
            expected: { params: {}, remaining: '/posts/edit/5' },
        });
        test({
            it: 'matches an exact path with nothing remaining',
            pattern: '/posts',
            value: '/posts',
            expected: { params: {}, remaining: '' },
        });
        test({
            it: 'matches a prefix and leaves the rest for a nested route',
            pattern: '/posts',
            value: '/posts/edit/5',
            expected: { params: {}, remaining: '/edit/5' },
        });
        test({
            it: 'captures a parameter while matching as a prefix',
            pattern: '/edit/{id}',
            value: '/edit/5/preview',
            expected: { params: { id: '5' }, remaining: '/preview' },
        });
        test({
            it: 'does not match a shared prefix that is not on a segment boundary',
            pattern: '/posts',
            value: '/posts-archive',
            expected: null,
        });
    });
});
