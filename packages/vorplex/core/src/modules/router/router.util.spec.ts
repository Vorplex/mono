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
        function test(args: { it: string; pattern: string; value: string; expected: Record<string, string> | null }) {
            it(args.it, () => {
                const result = $Router.match(args.pattern, args.value);
                expect(result).toEqual(args.expected);
            });
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
        test({
            it: 'should match a missing optional parameter without its slash',
            pattern: '/users/{id}/{tab?}',
            value: '/users/7',
            expected: { id: '7', tab: undefined },
        });
        test({
            it: 'should match a present optional parameter',
            pattern: '/users/{id}/{tab?}',
            value: '/users/7/settings',
            expected: { id: '7', tab: 'settings' },
        });
        test({
            it: 'should match a rest parameter across segments',
            pattern: '/files/{...path}',
            value: '/files/a/b/c.txt',
            expected: { path: 'a/b/c.txt' },
        });
        test({
            it: 'should match a missing rest parameter',
            pattern: '/files/{...path}',
            value: '/files',
            expected: { path: undefined },
        });
        test({
            it: 'should match a parameter inside a segment',
            pattern: '/files/report-{year}.pdf',
            value: '/files/report-2026.pdf',
            expected: { year: '2026' },
        });
        test({
            it: 'should treat literal characters literally',
            pattern: '/v1.0/items',
            value: '/v1x0/items',
            expected: null,
        });
        test({
            it: 'should match literal special characters',
            pattern: '/search/(all)+',
            value: '/search/(all)+',
            expected: {},
        });
    });

    describe($Router.matchPrefix.name, () => {
        function test(args: { it: string; pattern: string; value: string; expected: { params: Record<string, string>; rest: string } | null }) {
            it(args.it, () => {
                const result = $Router.matchPrefix(args.pattern, args.value);
                expect(result).toEqual(args.expected);
            });
        }

        test({
            it: 'root matches everything and consumes nothing',
            pattern: '/',
            value: '/posts/edit/5',
            expected: { params: {}, rest: '/posts/edit/5' },
        });
        test({
            it: 'matches an exact path with nothing remaining',
            pattern: '/posts',
            value: '/posts',
            expected: { params: {}, rest: '' },
        });
        test({
            it: 'matches a prefix and leaves the rest for a nested route',
            pattern: '/posts',
            value: '/posts/edit/5',
            expected: { params: {}, rest: '/edit/5' },
        });
        test({
            it: 'captures a parameter while matching as a prefix',
            pattern: '/edit/{id}',
            value: '/edit/5/preview',
            expected: { params: { id: '5' }, rest: '/preview' },
        });
        test({
            it: 'does not match a shared prefix that is not on a segment boundary',
            pattern: '/posts',
            value: '/posts-archive',
            expected: null,
        });
    });
});
