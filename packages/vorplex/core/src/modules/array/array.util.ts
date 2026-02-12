import type { Predicate } from '../../types/predicate.type';
import type { Selector } from '../../types/selector.type';

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
}
