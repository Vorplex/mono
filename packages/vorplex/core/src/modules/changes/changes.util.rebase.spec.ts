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
    // string patches
    test('should apply a remote string patch when local is unchanged', {
        source: { title: 'The quick brown fox' },
        remote: { title: 'The slow brown fox' },
        local: { title: 'The quick brown fox' },
        result: { result: { title: 'The slow brown fox' } },
    });
    test('should apply a local string patch when remote is unchanged', {
        source: { title: 'The quick brown fox' },
        remote: { title: 'The quick brown fox' },
        local: { title: 'The slow brown fox' },
        result: { result: { title: 'The slow brown fox' } },
    });
    test('should resolve conflicting string patches with local winning, reconstructed against the correct base', {
        source: { title: 'The quick brown fox' },
        remote: { title: 'The slow brown fox' },
        local: { title: 'The quick brown fox jumps high' },
        result: {
            result: { title: 'The quick brown fox jumps high' },
            conflict: {
                local: { differences: undefined, similarities: undefined, conflicts: { title: [19, 19, ' jumps high'] } },
                remote: { differences: undefined, similarities: undefined, conflicts: { title: [4, 9, 'slow'] } },
                merge: {
                    source: { title: 'The quick brown fox' },
                    remote: { title: 'The slow brown fox' },
                    local: { title: 'The quick brown fox jumps high' }
                },
            },
        },
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
                    local: { a: 2 }
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
                    local: { x: { a: 2 } }
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
                    local: {}
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
                    local: { a: { b: 2 } }
                },
            },
        },
    });
    // concurrent array insertions at the same target position
    test('should handle concurrent array insertions at the same position without conflict', {
        source: { nodes: [{ id: 'a', type: 'element' }] },
        remote: { nodes: [{ id: 'a', type: 'element' }, { id: 'b', type: 'element' }] },
        local: { nodes: [{ id: 'a', type: 'element' }, { id: 'c', type: 'element' }] },
        result: {
            result: { nodes: [{ id: 'a', type: 'element' }, { id: 'c', type: 'element' }, { id: 'b', type: 'element' }] },
        },
    });
    test('should resolve a conflicting leaf against its untouched source value when a sibling is a non-conflicting difference', {
        source: { doc: { title: 'The quick brown fox', status: 'draft', owner: 'alice' } },
        remote: { doc: { title: 'The slow brown fox', status: 'draft', owner: 'alice' } },
        local: { doc: { title: 'The quick brown fox jumps high', status: 'published', owner: 'alice' } },
        result: {
            result: { doc: { title: 'The quick brown fox jumps high', status: 'published', owner: 'alice' } },
            conflict: {
                local: { differences: { doc: { status: 'published' } }, similarities: undefined, conflicts: { doc: { title: [19, 19, ' jumps high'] } } },
                remote: { differences: undefined, similarities: undefined, conflicts: { doc: { title: [4, 9, 'slow'] } } },
                merge: {
                    source: { doc: { title: 'The quick brown fox', status: 'published', owner: 'alice' } },
                    remote: { doc: { title: 'The slow brown fox', status: 'published', owner: 'alice' } },
                    local: { doc: { title: 'The quick brown fox jumps high', status: 'published', owner: 'alice' } },
                },
            },
        },
    });
    test('should resolve multiple simultaneous conflicts of different types with local winning each', {
        source: { title: 'The quick brown fox', count: 10, meta: { color: 'red' } },
        remote: { title: 'The slow brown fox', count: 20, meta: { color: 'blue' } },
        local: { title: 'The quick brown fox indeed', count: 30, meta: { color: 'green' } },
        result: {
            result: { title: 'The quick brown fox indeed', count: 30, meta: { color: 'green' } },
            conflict: {
                local: { differences: undefined, similarities: undefined, conflicts: { title: [19, 19, ' indeed'], count: 30, meta: { color: 'green' } } },
                remote: { differences: undefined, similarities: undefined, conflicts: { title: [4, 9, 'slow'], count: 20, meta: { color: 'blue' } } },
                merge: {
                    source: { title: 'The quick brown fox', count: 10, meta: { color: 'red' } },
                    remote: { title: 'The slow brown fox', count: 20, meta: { color: 'blue' } },
                    local: { title: 'The quick brown fox indeed', count: 30, meta: { color: 'green' } },
                },
            },
        },
    });
    test('should resolve a multi-hunk string conflict with local winning, reconstructed against the correct base', {
        source: { body: 'The report was reviewed by John Smith on Monday and approved by Jane Doe on Tuesday for release' },
        remote: { body: 'The report was reviewed by Alex Smith on Monday and approved by Jane Doe on Tuesday for launch' },
        local: { body: 'The report was reviewed by John Smith on Monday and approved by Jane Doe on Wednesday for shipping' },
        result: {
            result: { body: 'The report was reviewed by John Smith on Monday and approved by Jane Doe on Wednesday for shipping' },
            conflict: {
                local: { differences: undefined, similarities: undefined, conflicts: { body: [76, 95, 'Wednesday for shipping'] } },
                remote: { differences: undefined, similarities: undefined, conflicts: { body: [[27, 31, 'Alex'], [88, 95, 'launch']] } },
                merge: {
                    source: { body: 'The report was reviewed by John Smith on Monday and approved by Jane Doe on Tuesday for release' },
                    remote: { body: 'The report was reviewed by Alex Smith on Monday and approved by Jane Doe on Tuesday for launch' },
                    local: { body: 'The report was reviewed by John Smith on Monday and approved by Jane Doe on Wednesday for shipping' },
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
                    local: { a: 2, b: 2, c: 2, x: true }
                },
            },
        },
    });
});
