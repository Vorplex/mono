import { parsePath } from '../../functions/parse-path-selector.function';
import { $Object } from '../object/object.util';
import { $Value } from '../value/value.util';

export type ArrayChange = Record<`$${number}` | `$${number}+`, any | typeof $Changes.deleted>;

export interface ChangeConflicts {
    conflicts: any;
    differences: any;
}

export interface ChangeRebase<T = any> {
    result: T;
    conflicts?: {
        local: ChangeConflicts;
        remote: ChangeConflicts;
    };
    merge?: {
        source: T,
        remote: T,
        local: T
        result: T
    }
}

export class $Changes {

    public static readonly deleted = '[deleted]' as const;

    private static isArrayIndexChange(change: any): change is ArrayChange {
        if (change == null || typeof change !== 'object' || Array.isArray(change)) return false;
        if (!Object.keys(change).length) return;
        for (const k of Object.keys(change)) {
            if (!k.startsWith('$')) return false;
            const key = k.endsWith('+') ? k.slice(1, -1) : k.slice(1);
            const index = Number.parseInt(key, 10);
            if (Number.isNaN(index)) return false;
        }
        return true;
    }

    public static getArrayChanges(a: any[], b: any[]): ArrayChange | undefined {
        if ($Value.equals(a, b)) return;

        const result: ArrayChange = {};
        let i = 0; // index in a
        let j = 0; // index in b

        while (i < a.length && j < b.length) {
            if ($Value.equals(a[i], b[j])) {
                i++; j++;
                continue;
            }

            // Look for matches further ahead to detect multiple deletions/insertions
            let foundDeletion = false;
            for (let lookAhead = i + 1; lookAhead < a.length; lookAhead++) {
                if ($Value.equals(a[lookAhead], b[j])) {
                    // Found a match - mark all items between as deleted
                    for (let k = i; k < lookAhead; k++) {
                        result[`$${k}`] = $Changes.deleted;
                    }
                    i = lookAhead;
                    foundDeletion = true;
                    break;
                }
            }
            if (foundDeletion) continue;

            // Look for insertions
            let foundInsertion = false;
            for (let lookAhead = j + 1; lookAhead < b.length; lookAhead++) {
                if ($Value.equals(a[i], b[lookAhead])) {
                    // Found a match - mark all items between as insertions
                    for (let k = j; k < lookAhead; k++) {
                        result[`$${k}+`] = b[k];
                    }
                    j = lookAhead;
                    foundInsertion = true;
                    break;
                }
            }
            if (foundInsertion) continue;

            // Replace
            result[`$${i}`] = $Changes.get(a[i], b[j]);
            i++; j++;
        }

        // Remaining items in a were deleted
        for (; i < a.length; i++) result[`$${i}`] = $Changes.deleted;

        // Remaining items in b were appended (inserts at end)
        for (; j < b.length; j++) result[`$${j}+`] = b[j];

        return Object.keys(result).length ? result : undefined;
    }

    public static getObjectChanges(a: Record<string, any>, b: Record<string, any>): Record<string, any | typeof $Changes.deleted> {
        const changes: Record<string, any | typeof $Changes.deleted> = {};
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const key of keys) {
            if (!(key in b)) {
                changes[key] = $Changes.deleted;
            } else if (!(key in a)) {
                changes[key] = b[key];
            } else {
                const change = $Changes.get(a[key], b[key]);
                if (change !== undefined) {
                    changes[key] = change;
                }
            }
        }
        return Object.keys(changes).length ? changes : undefined;
    }

    public static get(a: any, b: any): undefined | any | Record<string, any | typeof $Changes.deleted> | ArrayChange {
        if (a === b) return;
        if (a == null || b == null) return b;
        if (typeof a !== 'object') return b;
        if (typeof a !== typeof b) return b;
        if (Array.isArray(a) !== Array.isArray(b)) return b;
        if (Array.isArray(a) && Array.isArray(b)) return $Changes.getArrayChanges(a, b);
        return $Changes.getObjectChanges(a, b);
    }

    public static classifyPathsByOverlap(changesA: any, changesB: any): { conflicts: string[], differences: string[] } {
        const aPaths = $Object.getPaths(changesA);
        const bPaths = $Object.getPaths(changesB);
        const conflicts = new Set<string>();
        const differences = new Set<string>();
        for (const aPath of aPaths) {
            if (bPaths.some(bPath => this.pathsOverlap(aPath, bPath))) conflicts.add(aPath);
            else differences.add(aPath);
        }
        for (const bPath of bPaths) {
            if (aPaths.some(aPath => this.pathsOverlap(aPath, bPath))) conflicts.add(bPath);
            else differences.add(bPath);
        }
        return {
            conflicts: Array.from(conflicts),
            differences: Array.from(differences)
        };
    }

    public static resolveConflicts(changesA: any, changesB: any): ChangeConflicts {
        const { conflicts, differences } = this.classifyPathsByOverlap(changesA, changesB);
        return {
            differences: $Changes.excludeChanges(changesB, conflicts),
            conflicts: $Changes.excludeChanges(changesB, differences)
        };
    }

    private static pathsOverlap(a: string, b: string): boolean {
        const selectorsA = parsePath(a);
        const selectorsB = parsePath(b);
        const length = Math.min(selectorsA.length, selectorsB.length);
        for (let i = 0; i < length; i++) {
            if (selectorsA[i] !== selectorsB[i]) return false;
        }
        return true;
    }

    public static hasConflict(changesA: any, changesB: any): boolean {
        const aPaths = $Object.getPaths(changesA);
        const bPaths = $Object.getPaths(changesB);
        for (const bPath of bPaths) {
            for (const aPath of aPaths) {
                if (this.pathsOverlap(aPath, bPath)) return true;
            }
        }
        return false;
    }

    public static asValue(changes: any): any {
        if (changes === undefined) return undefined;

        if (Array.isArray(changes)) {
            return changes.map(item => $Changes.asValue(item));
        }

        if (typeof changes === 'object' && changes !== null) {
            // cannot materialize array index changes without a base; strip them
            if ($Changes.isArrayIndexChange(changes)) return undefined;

            const result: Record<string, any> = {};
            for (const [key, value] of Object.entries(changes)) {
                if (value === $Changes.deleted) continue;
                result[key] = $Changes.asValue(value);
            }
            return result;
        }

        return changes;
    }

    public static apply(value: any, changes: any): any {
        function applyArrayChange(originalArray: any[], change: any): any[] {
            if (!$Changes.isArrayIndexChange(change)) return $Value.clone(change);

            const result = $Value.clone(originalArray);

            const entries = Object.entries(change)
                .map(([k, v]) => {
                    const isInsert = k.endsWith('+');
                    const nStr = isInsert ? k.slice(1, -1) : k.slice(1);
                    return [Number.parseInt(nStr, 10), isInsert, v] as const;
                })
                .filter(([i]) => !Number.isNaN(i))
                .sort(([iA, insA, vA], [iB, insB, vB]) => {
                    const aDel = vA === $Changes.deleted;
                    const bDel = vB === $Changes.deleted;

                    // deletes first, highest -> lowest
                    if (aDel !== bDel) return aDel ? -1 : 1;
                    if (aDel && bDel) return iB - iA;

                    // inserts next, lowest -> highest
                    if (insA !== insB) return insA ? -1 : 1;
                    if (insA && insB) return iA - iB;

                    // sets last, lowest -> highest
                    return iA - iB;
                });

            for (const [index, isInsert, op] of entries) {
                if (op === $Changes.deleted) {
                    if (index >= 0 && index < result.length) result.splice(index, 1);
                } else if (isInsert) {
                    const v = $Value.clone(op);
                    const idx = Math.min(Math.max(index, 0), result.length);
                    result.splice(idx, 0, v);
                } else {
                    if (index >= result.length) result.length = index + 1;
                    result[index] = $Changes.apply(result[index], op);
                }
            }

            return result;
        }

        if (changes === undefined) return value;
        if (value == null || typeof changes !== 'object') return $Changes.asValue(changes);

        if (Array.isArray(value)) {
            return applyArrayChange(value, changes);
        } else if (typeof value === 'object') {
            if (Array.isArray(changes)) return $Changes.asValue(changes);
            const result = { ...value };
            for (const [key, change] of Object.entries(changes)) {
                if (change === $Changes.deleted) {
                    delete result[key];
                } else if (Array.isArray(result[key])) {
                    result[key] = applyArrayChange(result[key] || [], change);
                } else if (typeof change === 'object' && change !== null) {
                    result[key] = $Changes.apply(result[key], change);
                } else {
                    result[key] = change;
                }
            }
            return result;
        }

        return $Changes.asValue(changes);
    }

    public static rebase(source: any, local: any, remote: any): ChangeRebase {
        const localChanges = $Changes.get(source, local);
        const remoteChanges = $Changes.get(source, remote);
        if (localChanges === undefined || $Value.equals(localChanges, remoteChanges)) {
            return { result: $Changes.apply(source, remoteChanges) };
        } if (remoteChanges === undefined) {
            return { result: $Changes.apply(source, localChanges) };
        } else if (!$Changes.hasConflict(remoteChanges, localChanges)) {
            let result = $Changes.apply(source, localChanges);
            result = $Changes.apply(result, remoteChanges);
            return { result };
        } else {
            const localConflict = $Changes.resolveConflicts(remoteChanges, localChanges);
            const remoteConflict = $Changes.resolveConflicts(localChanges, remoteChanges);
            const sourceWithDifferences = $Changes.apply($Changes.apply(source, remoteConflict.differences), localConflict.differences);
            const mergedWithLocalDifferences = $Changes.apply(remote, localConflict.differences);
            return {
                conflicts: {
                    local: localConflict,
                    remote: remoteConflict,
                },
                merge: {
                    source: sourceWithDifferences,
                    remote: $Changes.apply(sourceWithDifferences, remoteConflict.conflicts),
                    local: $Changes.apply(sourceWithDifferences, localConflict.conflicts),
                    result: mergedWithLocalDifferences
                },
                result: $Changes.apply(mergedWithLocalDifferences, localConflict.conflicts)
            };
        }
    }

    /**
     * Excludes specific paths from a changes object and cleans up empty containers.
     * Empty objects {} left behind after exclusion are recursively cleaned up,
     * unless they existed in the original changes (intentional {} changes are preserved).
     *
     * @param changes - The changes object to filter
     * @param paths - Array of dot-notation paths to exclude (e.g., ['user.name', 'config.theme'])
     * @returns The filtered changes object with empty containers cleaned up
     */
    public static excludeChanges(changes: any, paths: string[]): any {
        if (!paths.length) return changes;
        if (typeof changes !== 'object' || changes == null || Array.isArray(changes)) return changes;
        const result = $Value.clone(changes);
        for (const pathString of paths) {
            $Value.unset(result, pathString);
        }
        function cleanupEmptyObjects(current: any, original: any): any {
            if (current == null || typeof current !== 'object') return current;
            if (Array.isArray(current)) return current.map((item, index) => cleanupEmptyObjects(item, original?.[index]));
            const cleaned: Record<string, any> = {};
            for (const [key, value] of Object.entries(current)) {
                if (value === $Changes.deleted) {
                    cleaned[key] = value;
                    continue;
                }
                const cleanedValue = cleanupEmptyObjects(value, original?.[key]);
                if (cleanedValue === undefined) continue;
                if (!$Object.isEmptyObject(cleanedValue) || $Object.isEmptyObject(original?.[key])) cleaned[key] = cleanedValue;
            }
            if (Object.keys(cleaned).length === 0) return $Object.isEmptyObject(original) ? {} : undefined;
            return cleaned;
        }
        return cleanupEmptyObjects(result, changes);
    }

}
