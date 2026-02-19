import { $Changes, ChangeRebase } from './changes.util';

describe($Changes.rebase.name, () => {
    function test(message: string, { source, local, remote, result }: { source: any, local: any, remote: any, result: ChangeRebase }) {
        it(message, () => {
            const rebase = $Changes.rebase(source, local, remote);
            expect(rebase).toEqual(result);
        });
    }

    // no changes
    test('should return remote when local has no changes', {
        source: { a: 1 },
        local: { a: 1 },
        remote: { a: 2 },
        result: { result: { a: 2 } }
    });
    test('should return local when remote has no changes', {
        source: { a: 1 },
        local: { a: 2 },
        remote: { a: 1 },
        result: { result: { a: 2 } }
    });
    // identical changes
    test('should return local/remote when both have identical changes', {
        source: { a: 1 },
        local: { a: 2 },
        remote: { a: 2 },
        result: { result: { a: 2 } }
    });
    test('should handle top-level deletions when local equals remote', {
        source: { a: 1, b: 2 },
        local: { b: 2 },
        remote: { b: 2 },
        result: { result: { b: 2 } }
    });
    test('should handle nested deletions when local equals remote', {
        source: { a: { b: 1, c: 2 } },
        local: { a: { c: 2 } },
        remote: { a: { c: 2 } },
        result: { result: { a: { c: 2 } } }
    });
    test('should handle structural changes when local equals remote', {
        source: { widgetProperties: { id: '1' }, widgets: { w1: { propertyIds: ['1'] } } },
        local: { widgets: { w1: { properties: { id: '1' } } } },
        remote: { widgets: { w1: { properties: { id: '1' } } } },
        result: { result: { widgets: { w1: { properties: { id: '1' } } } } }
    });
    // non-conflicting changes
    test('should merge non-conflicting changes from both', {
        source: { a: 1, b: 1 },
        local: { a: 2, b: 1 },
        remote: { a: 1, b: 2 },
        result: { result: { a: 2, b: 2 } }
    });
    test('should merge nested non-conflicting changes', {
        source: { x: { a: 1, b: 1 } },
        local: { x: { a: 2, b: 1 } },
        remote: { x: { a: 1, b: 2 } },
        result: { result: { x: { a: 2, b: 2 } } }
    });
    // conflicts
    test('should detect conflict when both modify the same property', {
        source: { a: 1 },
        local: { a: 2 },
        remote: { a: 3 },
        result: {
            result: { a: 2 },
            conflict: {
                local: { similarities: undefined, conflicts: { a: 2 }, differences: undefined },
                remote: { similarities: undefined, conflicts: { a: 3 }, differences: undefined },
                merge: {
                    source: { a: 1 },
                    remote: { a: 3 },
                    local: { a: 2 },
                    result: { a: 3 }
                }
            }
        }
    });
    test('should detect conflict when both modify nested property', {
        source: { x: { a: 1 } },
        local: { x: { a: 2 } },
        remote: { x: { a: 3 } },
        result: {
            result: { x: { a: 2 } },
            conflict: {
                local: { similarities: undefined, conflicts: { x: { a: 2 } }, differences: undefined },
                remote: { similarities: undefined, conflicts: { x: { a: 3 } }, differences: undefined },
                merge: {
                    source: { x: { a: 1 } },
                    remote: { x: { a: 3 } },
                    local: { x: { a: 2 } },
                    result: { x: { a: 3 } }
                }
            }
        }
    });
    test('should detect conflict when local deletes and remote modifies', {
        source: { a: { b: 1 } },
        local: {},
        remote: { a: { b: 2 } },
        result: {
            result: {},
            conflict: {
                local: { similarities: undefined, conflicts: { a: $Changes.deleted }, differences: undefined },
                remote: { similarities: undefined, conflicts: { a: { b: 2 } }, differences: undefined },
                merge: {
                    source: { a: { b: 1 } },
                    remote: { a: { b: 2 } },
                    local: {},
                    result: { a: { b: 2 } }
                }
            }
        }
    });
    test('should detect conflict when local modifies and remote deletes', {
        source: { a: { b: 1 } },
        local: { a: { b: 2 } },
        remote: {},
        result: {
            result: { a: { b: 2 } },
            conflict: {
                local: { similarities: undefined, conflicts: { a: { b: 2 } }, differences: undefined },
                remote: { similarities: undefined, conflicts: { a: $Changes.deleted }, differences: undefined },
                merge: {
                    source: { a: { b: 1 } },
                    remote: {},
                    local: { a: { b: 2 } },
                    result: {}
                }
            }
        }
    });
    test('should merge non-conflicting changes while flagging conflicts', {
        source: { a: 1, b: 1, c: 1 },
        local: { a: 2, b: 1, c: 2, x: true },
        remote: { a: 3, b: 2, c: 1, x: true },
        result: {
            result: { a: 2, b: 2, c: 2, x: true },
            conflict: {
                local: { similarities: { x: true }, conflicts: { a: 2 }, differences: { c: 2 } },
                remote: { similarities: { x: true }, conflicts: { a: 3 }, differences: { b: 2 } },
                merge: {
                    source: { a: 1, b: 2, c: 2, x: true },
                    remote: { a: 3, b: 2, c: 2, x: true },
                    local: { a: 2, b: 2, c: 2, x: true },
                    result: { a: 3, b: 2, c: 2, x: true }
                }
            }
        }
    });
});
