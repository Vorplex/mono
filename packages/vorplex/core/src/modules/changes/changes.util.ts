import { $Value } from '../value/value.util';

export type ArrayChange = Record<`$${number}` | `$${number}+`, any | typeof $Changes.deleted>;

export interface ChangeCompareResult {
    differences: any;
    similarities: any;
    conflicts: any;
}

export interface ChangeRebase<T = any> {
    /**
     * The remote with local changes applied
     */
    result: T;
    /**
     * Only defined when the rebase contains conflicts.
     * Contains rebase conflicts and merge context.
     */
    conflict?: {
        local: ChangeCompareResult;
        remote: ChangeCompareResult;
        merge?: {
            /**
             * The source with all non-conflicting changes from both sides applied
             */
            source: T;
            /**
             * The `.source` with remote conflicting changes applied
             */
            remote: T;
            /**
             * The `.source` with local conflicting changes applied
             */
            local: T;
            /**
             * The remote with local non-conflicting changes applied
             */
            result: T;
        };
    };
}

type ArrayOperation =
    | { type: 'keep'; sourceIndex: number; targetIndex: number }
    | { type: 'delete'; sourceIndex: number }
    | { type: 'insert'; targetIndex: number; value: any }
    | { type: 'update'; sourceIndex: number; targetIndex: number; value: any };

export class $Changes {

    public static readonly deleted = '[deleted]' as const;

    /**
     * Compute a minimal change object between `a` (base) and `b` (target).
     * Returns `undefined` when there is no difference.
     */
    public static get(a: any, b: any): any {
        function getObjectChanges(a: Record<string, any>, b: Record<string, any>): any {
            const changes: Record<string, any> = {};
            const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

            for (const key of keys) {
                if (!(key in b)) {
                    changes[key] = $Changes.deleted;
                } else if (!(key in a)) {
                    changes[key] = b[key];
                } else {
                    const change = $Changes.get(a[key], b[key]);
                    if (change !== undefined) changes[key] = change;
                }
            }

            return Object.keys(changes).length ? changes : undefined;
        }
        function getArrayChanges(base: any[], target: any[]): ArrayChange | undefined {
            function getArrayOperations(base: any[], target: any[]): ArrayOperation[] {
                function getLcsMatrix(a: any[], b: any[]): number[][] {
                    const matrix: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
                    for (let i = 1; i <= a.length; i++) {
                        for (let j = 1; j <= b.length; j++) {
                            matrix[i][j] = $Value.equals(a[i - 1], b[j - 1])
                                ? matrix[i - 1][j - 1] + 1
                                : Math.max(matrix[i - 1][j], matrix[i][j - 1]);
                        }
                    }
                    return matrix;
                }
                const matrix = getLcsMatrix(base, target);
                const operations: ArrayOperation[] = [];
                let i = base.length;
                let j = target.length;
                while (i > 0 || j > 0) {
                    if (i > 0 && j > 0 && $Value.equals(base[i - 1], target[j - 1])) {
                        operations.push({ type: 'keep', sourceIndex: i - 1, targetIndex: j - 1 });
                        i--;
                        j--;
                    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
                        operations.push({ type: 'insert', targetIndex: j - 1, value: target[j - 1] });
                        j--;
                    } else {
                        operations.push({ type: 'delete', sourceIndex: i - 1 });
                        i--;
                    }
                }
                return operations.reverse();
            }
            if (!target.length) return [] as any;
            const operations = getArrayOperations(base, target);
            const paired: ArrayOperation[] = [];
            for (let i = 0; i < operations.length; i++) {
                const current = operations[i];
                const next = operations[i + 1];
                if (current.type === 'delete' && next?.type === 'insert') {
                    paired.push({ type: 'update', sourceIndex: current.sourceIndex, targetIndex: next.targetIndex, value: next.value });
                    i++;
                } else {
                    paired.push(current);
                }
            }
            const changes: Record<string, any> = {};
            let baseIdx = 0;
            let targetIdx = 0;
            for (const op of paired) {
                if (op.type === 'keep') {
                    baseIdx++;
                    targetIdx++;
                } else if (op.type === 'delete') {
                    changes[`$${op.sourceIndex}`] = $Changes.deleted;
                    baseIdx++;
                } else if (op.type === 'update') {
                    const d = $Changes.get(base[op.sourceIndex], op.value);
                    changes[`$${op.sourceIndex}`] = d !== undefined ? d : op.value;
                    baseIdx++;
                    targetIdx++;
                } else {
                    changes[`$${op.targetIndex}+`] = op.value;
                    targetIdx++;
                }
            }
            return Object.keys(changes).length ? changes as ArrayChange : undefined;
        }
        if ($Value.equals(a, b)) return undefined;
        if (a == null || b == null) return b;
        if (typeof a !== typeof b) return b;
        if (Array.isArray(a) !== Array.isArray(b)) return b;
        if (Array.isArray(a) && Array.isArray(b)) return getArrayChanges(a, b);
        if (typeof a === 'object' && typeof b === 'object') return getObjectChanges(a, b);
        return b;
    }

    /**
     * Compare two change sets and split `a` into three buckets:
     * - `differences`  — entries in `a` absent in `b`
     * - `similarities` — entries in `a` identical to corresponding entries in `b`
     * - `conflicts`    — entries in `a` that clash with `b`
     */
    public static compareChanges(a: any, b: any): ChangeCompareResult {
        if (a === undefined && b === undefined) return { differences: undefined, similarities: undefined, conflicts: undefined };
        if (a === undefined) return { differences: undefined, similarities: undefined, conflicts: undefined };
        if (b === undefined) return { differences: a, similarities: undefined, conflicts: undefined };
        if ($Value.isPrimitive(a) || $Value.isPrimitive(b) || Array.isArray(a) !== Array.isArray(b)) {
            if ($Value.equals(a, b)) return { differences: undefined, similarities: a, conflicts: undefined };
            return { differences: undefined, similarities: undefined, conflicts: a };
        }
        const aChanges = a as Record<string, any>;
        const bChanges = b as Record<string, any>;
        const allKeys = new Set([...Object.keys(aChanges), ...Object.keys(bChanges)]);
        const differences: Record<string, any> = {};
        const similarities: Record<string, any> = {};
        const conflicts: Record<string, any> = {};
        for (const key of allKeys) {
            const aValue = aChanges[key];
            const bValue = bChanges[key];
            if (aValue === undefined) continue;
            if (bValue === undefined) {
                differences[key] = aValue;
            } else if ($Value.equals(aValue, bValue)) {
                similarities[key] = aValue;
            } else if (/^\$\d+\+$/.test(key)) {
                differences[key] = aValue;
            } else if ($Value.isObject(aValue) && $Value.isObject(bValue)) {
                const nested = $Changes.compareChanges(aValue, bValue);
                if (nested.differences !== undefined) differences[key] = nested.differences;
                if (nested.similarities !== undefined) similarities[key] = nested.similarities;
                if (nested.conflicts !== undefined) conflicts[key] = nested.conflicts;
            } else {
                conflicts[key] = aValue;
            }
        }
        return {
            differences: Object.keys(differences).length ? differences : undefined,
            similarities: Object.keys(similarities).length ? similarities : undefined,
            conflicts: Object.keys(conflicts).length ? conflicts : undefined,
        };
    }

    public static apply(base: any, ...changes: any[]): any {
        function applyArrayChanges(base: any[], changes: any): any[] {
            base = [...base];
            const deletes: number[] = [];
            const updates: Map<number, any> = new Map();
            const inserts: Map<number, any> = new Map();
            for (const [key, value] of Object.entries(changes)) {
                const insertMatch = key.match(/^\$(?<index>\d+)\+$/);
                const updateMatch = key.match(/^\$(?<index>\d+)$/);
                if (insertMatch) {
                    inserts.set(Number.parseInt(insertMatch.groups.index, 10), value);
                } else if (updateMatch) {
                    const index = Number.parseInt(updateMatch.groups.index, 10);
                    if (value === $Changes.deleted) deletes.push(index);
                    else updates.set(index, value);
                }
            }
            const sortedDeletes = deletes.sort((a, b) => b - a);
            for (const index of sortedDeletes) {
                if (index >= base.length) throw new Error(`Delete index ${index} out of bounds`);
                base.splice(index, 1);
            }
            for (const [index, value] of updates) {
                const deletedBefore = sortedDeletes.filter((d) => d < index).length;
                const adjustedIdx = index - deletedBefore;
                if (adjustedIdx >= base.length) throw new Error(`Update index ${index} out of bounds`);
                base[adjustedIdx] = $Changes.apply(base[adjustedIdx], value);
            }
            const sortedInserts = [...inserts.entries()].sort((a, b) => a[0] - b[0]);
            for (const [index, value] of sortedInserts) {
                base.splice(index, 0, value);
            }
            return base;
        }
        function isArrayChange(change: any): change is ArrayChange {
            if (change == null || typeof change !== 'object' || Array.isArray(change)) return false;
            if (!Object.keys(change).length) return false;
            for (const k of Object.keys(change)) {
                if (!k.startsWith('$')) return false;
                const key = k.endsWith('+') ? k.slice(1, -1) : k.slice(1);
                if (Number.isNaN(Number.parseInt(key, 10))) return false;
            }
            return true;
        }
        function apply(base: any, changes: any) {
            if (changes === undefined) return base;
            if (Array.isArray(changes)) return changes;
            if (typeof changes !== 'object' || changes === null) return changes;

            if (isArrayChange(changes)) {
                if (!Array.isArray(base)) throw new Error('Cannot apply array changes to non-array');
                return applyArrayChanges(base, changes);
            }

            if (Array.isArray(base)) return applyArrayChanges(base, changes);

            if (typeof base !== 'object' || base === null) return changes;

            const result = { ...base };
            for (const [key, value] of Object.entries(changes)) {
                if (value === $Changes.deleted) {
                    delete result[key];
                } else {
                    result[key] = $Changes.apply(result[key] !== undefined ? result[key] : null, value);
                }
            }
            return result;
        }
        for (const change of changes) {
            base = apply(base, change);
        }
        return base;
    }

    /**
     * 3-way rebase of source, remote and local
     *
     * Applies remote changes onto source, then rebases local on top.
     * Local always wins on conflict.
     *
     * Returns a `ChangeRebase` with:
     * - `result` — the final merged value
     * - `conflict` — present only when overlapping changes are detected
     */
    public static rebase<T = any>(source: T, remote: T, local: T): ChangeRebase<T> {
        const remoteChanges = $Changes.get(source, remote);
        const localChanges = $Changes.get(source, local);
        if (localChanges === undefined || $Value.equals(localChanges, remoteChanges)) return { result: $Changes.apply(source, remoteChanges) };
        if (remoteChanges === undefined) return { result: $Changes.apply(source, localChanges) };
        const localCompare = $Changes.compareChanges(localChanges, remoteChanges);
        const remoteCompare = $Changes.compareChanges(remoteChanges, localChanges);
        const hasConflicts = localCompare.conflicts !== undefined || remoteCompare.conflicts !== undefined;
        if (!hasConflicts) {
            const result = $Changes.apply(source, remoteChanges, localCompare.differences);
            return { result };
        }
        const sourceWithDifferences = $Changes.apply(
            source,
            remoteCompare.differences,
            localCompare.differences,
            remoteCompare.similarities,
            localCompare.similarities
        );
        const mergedWithLocalDifferences = $Changes.apply(remote, localCompare.differences);
        return {
            result: $Changes.apply(mergedWithLocalDifferences, localCompare.conflicts),
            conflict: {
                local: localCompare,
                remote: remoteCompare,
                merge: {
                    source: sourceWithDifferences,
                    remote: $Changes.apply(sourceWithDifferences, remoteCompare.conflicts),
                    local: $Changes.apply(sourceWithDifferences, localCompare.conflicts),
                    result: mergedWithLocalDifferences,
                },
            },
        };
    }

}