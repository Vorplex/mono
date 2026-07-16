import type { Predicate } from '../../types/predicate.type';
import type { Selector } from '../../types/selector.type';
import { $Value } from '../value/value.util';

export type ArrayDiffOperation<T> =
    | { type: 'keep'; sourceIndex: number; targetIndex: number }
    | { type: 'delete'; sourceIndex: number }
    | { type: 'insert'; targetIndex: number; value: T };

export class $Array {
    public static isUnique(array: any[]): boolean {
        return new Set(array).size === array.length;
    }

    public static removeWhere<T>(array: T[], predicate: Predicate<T>, first?: boolean): T[] {
        const result = [...array];
        for (const [index, item] of result.entries()) {
            if (predicate(item)) {
                result.splice(index, 1);
                if (first) return result;
            }
        }
        return result;
    }

    public static remove<T>(array: T[], ...items: T[]): T[] {
        const result = [...array];
        for (const item of items) {
            const index = result.indexOf(item);
            if (index !== -1) result.splice(index, 1);
        }
        return result;
    }

    public static toggle<T>(array: T[], ...items: T[]): T[] {
        const result = [...array];
        for (const item of items) {
            const index = result.indexOf(item);
            if (index !== -1) result.splice(index, 1);
            else result.push(item);
        }
        return result;
    }

    public static upsert<T>(array: T[], ...items: T[]): T[] {
        const result = [...array];
        for (const item of items) {
            if (!result.includes(item)) result.push(item);
        }
        return result;
    }

    public static removeAt<T>(array: T[], ...indexes: number[]): T[] {
        const result = [...array];
        for (const index of indexes) {
            result.splice(index, 1);
        }
        return result;
    }

    public static swap<T>(array: T[], indexA: number, indexB: number): T[] {
        const result = [...array];
        if (indexA === indexB) return result;
        const temp = result[indexA];
        result[indexA] = result[indexB];
        result[indexB] = temp;
        return result;
    }

    public static insert<T>(array: T[], index: number, ...items: T[]): T[] {
        const result = [...array];
        result.splice(index, 0, ...items);
        return result;
    }

    public static move<T>(array: T[], item: T, index: number): T[] {
        return $Array.moveAt(array, array.indexOf(item), index);
    }

    public static moveAt<T>(array: T[], sourceIndex: number, destinationIndex: number): T[] {
        const result = [...array];
        const item = result[sourceIndex];
        result.splice(sourceIndex, 1);
        result.splice(destinationIndex, 0, item);
        return result;
    }

    public static order<T>(array: T[], order?: 'asc' | 'desc'): T[] {
        return $Array.orderBy(array, (a) => a, order);
    }

    public static orderBy<T>(array: T[], selector: Selector<T>, order?: 'asc' | 'desc'): T[] {
        const result = [...array];
        const compare = (a: any, b: any) => {
            if (a == null && b == null) return 0;
            if (a == null) return 1;
            if (b == null) return -1;
            if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
            if (a instanceof Date && b instanceof Date) {
                a = a.getTime();
                b = b.getTime();
            }
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        };
        result.sort((a, b) => compare(selector(a), selector(b)) * (order === 'desc' ? -1 : 1));
        return result;
    }

    public static last<T>(array: T[]): T {
        return array[array.length - 1];
    }

    public static diff<T>(base: T[], target: T[]): ArrayDiffOperation<T>[] {
        const matrix: number[][] = Array.from({ length: base.length + 1 }, () => new Array(target.length + 1).fill(0));
        for (let i = 1; i <= base.length; i++) {
            for (let j = 1; j <= target.length; j++) {
                matrix[i][j] = $Value.equals(base[i - 1], target[j - 1])
                    ? matrix[i - 1][j - 1] + 1
                    : Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
        const operations: ArrayDiffOperation<T>[] = [];
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
}
