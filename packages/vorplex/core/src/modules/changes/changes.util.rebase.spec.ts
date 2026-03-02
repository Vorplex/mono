import { $Changes } from './changes.util';

describe($Changes.rebase.name, () => {
    function test(message, { source, remote, local, result }) {
        it(message, () => {
            expect($Changes.rebase(source, remote, local)).toEqual(result);
        });
    }

    // no changes
    test('should apply remote when local is unchanged', {
        source: { a: 1 },
        remote: { a: 2 },
        local: { a: 1 },
        result: { result: { a: 2 } },
    });
    test('should apply local when remote is unchanged', {
        source: { a: 1 },
        remote: { a: 1 },
        local: { a: 2 },
        result: { result: { a: 2 } },
    });
    // identical changes
    test('should apply once when both have identical changes', {
        source: { a: 1 },
        remote: { a: 2 },
        local: { a: 2 },
        result: { result: { a: 2 } },
    });
    test('should handle top-level deletions when local equals remote', {
        source: { a: 1, b: 2 },
        remote: { b: 2 },
        local: { b: 2 },
        result: { result: { b: 2 } },
    });
    test('should handle nested deletions when local equals remote', {
        source: { a: { b: 1, c: 2 } },
        remote: { a: { c: 2 } },
        local: { a: { c: 2 } },
        result: { result: { a: { c: 2 } } },
    });
    // non-conflicting changes
    test('should merge non-conflicting changes from both', {
        source: { a: 1, b: 1 },
        remote: { a: 2, b: 1 },
        local: { a: 1, b: 2 },
        result: { result: { a: 2, b: 2 } },
    });
    test('should merge nested non-conflicting changes', {
        source: { x: { a: 1, b: 1 } },
        remote: { x: { a: 2, b: 1 } },
        local: { x: { a: 1, b: 2 } },
        result: { result: { x: { a: 2, b: 2 } } },
    });
    // conflicts — local always wins
    test('should resolve conflict with local winning', {
        source: { a: 1 },
        remote: { a: 3 },
        local: { a: 2 },
        result: {
            result: { a: 2 },
            conflict: {
                local: { differences: undefined, similarities: undefined, conflicts: { a: 2 } },
                remote: { differences: undefined, similarities: undefined, conflicts: { a: 3 } },
                merge: {
                    source: { a: 1 },
                    remote: { a: 3 },
                    local: { a: 2 },
                    result: { a: 3 }
                },
            },
        },
    });
    test('should resolve nested conflict with local winning', {
        source: { x: { a: 1 } },
        remote: { x: { a: 3 } },
        local: { x: { a: 2 } },
        result: {
            result: { x: { a: 2 } },
            conflict: {
                local: { differences: undefined, similarities: undefined, conflicts: { x: { a: 2 } } },
                remote: { differences: undefined, similarities: undefined, conflicts: { x: { a: 3 } } },
                merge: {
                    source: { x: { a: 1 } },
                    remote: { x: { a: 3 } },
                    local: { x: { a: 2 } },
                    result: { x: { a: 3 } }
                },
            },
        },
    });
    test('should resolve conflict when local deletes and remote modifies', {
        source: { a: { b: 1 } },
        remote: { a: { b: 2 } },
        local: {},
        result: {
            result: {},
            conflict: {
                local: { differences: undefined, similarities: undefined, conflicts: { a: $Changes.deleted } },
                remote: { differences: undefined, similarities: undefined, conflicts: { a: { b: 2 } } },
                merge: {
                    source: { a: { b: 1 } },
                    remote: { a: { b: 2 } },
                    local: {},
                    result: { a: { b: 2 } }
                },
            },
        },
    });
    test('should resolve conflict when local modifies and remote deletes', {
        source: { a: { b: 1 } },
        remote: {},
        local: { a: { b: 2 } },
        result: {
            result: { a: { b: 2 } },
            conflict: {
                local: { differences: undefined, similarities: undefined, conflicts: { a: { b: 2 } } },
                remote: { differences: undefined, similarities: undefined, conflicts: { a: $Changes.deleted } },
                merge: {
                    source: { a: { b: 1 } },
                    remote: {},
                    local: { a: { b: 2 } },
                    result: {}
                },
            },
        },
    });
    test('should merge non-conflicting changes while flagging conflicts', {
        source: { a: 1, b: 1, c: 1 },
        remote: { a: 3, b: 2, c: 1, x: true },
        local: { a: 2, b: 1, c: 2, x: true },
        result: {
            result: { a: 2, b: 2, c: 2, x: true },
            conflict: {
                local: {
                    differences: { c: 2 },
                    similarities: { x: true },
                    conflicts: { a: 2 }
                },
                remote: {
                    differences: { b: 2 },
                    similarities: { x: true },
                    conflicts: { a: 3 }
                },
                merge: {
                    source: { a: 1, b: 2, c: 2, x: true },
                    remote: { a: 3, b: 2, c: 2, x: true },
                    local: { a: 2, b: 2, c: 2, x: true },
                    result: { a: 3, b: 2, c: 2, x: true },
                },
            },
        },
    });
});
