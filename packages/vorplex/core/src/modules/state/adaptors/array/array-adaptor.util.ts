import type { KeysOfType } from '../../../../types/keys-of-type.type';
import type { Predicate } from '../../../../types/predicate.type';
import type { Selector } from '../../../../types/selector.type';
import { $Array } from '../../../array/array.util';
import { State } from '../../state.model';
import type { Update, UpdateFunc } from '../../update.type';

export class ArrayAdaptor<TState, TItem, TString extends keyof KeysOfType<TState, TItem[]>> {
    constructor(private key: TString) {}

    public static updateWhere<T>(array: T[], query?: Predicate<T>, ...updates: Update<T>[]): T[] {
        array = [...array];
        for (const [index, item] of array.entries()) {
            if (!query || query(item)) {
                array[index] = State.update(item, ...updates);
            }
        }
        return array;
    }

    public static updateAtIndex<T>(array: T[], index: number, ...updates: Update<T>[]): T[] {
        array = [...array];
        array[index] = State.update(array[index], ...updates);
        return array;
    }

    public static updateAll<T>(array: T[], ...updates: Update<T>[]): T[] {
        return ArrayAdaptor.updateWhere(array, null, ...updates);
    }

    public static upsert<T>(array: T[], ...items: T[]): T[] {
        return ArrayAdaptor.upsertBy(array, (item) => item, ...items);
    }

    public static upsertBy<T>(array: T[], selector: Selector<T>, ...items: T[]): T[] {
        array = [...array];
        for (const item of items) {
            const index = array.findIndex((existing) => selector(existing) === selector(item));
            if (index > -1) array[index] = item;
            else array.push(item);
        }
        return array;
    }

    public updateWhere(query?: Predicate<TItem>, ...updates: Update<TItem>[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: ArrayAdaptor.updateWhere(state[this.key] as TItem[], query, ...updates),
            }) as Partial<TState>;
    }

    public set(items: TItem[]): UpdateFunc<TState> {
        return (state) =>
            ({
                [this.key]: items,
            }) as Partial<TState>;
    }

    public updateAll(...updates: Update<TItem>[]): Update<TState> {
        return this.updateWhere(null, ...updates);
    }

    public add(...items: TItem[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: (state[this.key] as TItem[]).concat(...items),
            }) as Partial<TState>;
    }

    public insert(index: number, ...items: TItem[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.insert(state[this.key] as TItem[], index, ...items),
            }) as Partial<TState>;
    }

    public upsert(...items: TItem[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.upsert(state[this.key] as TItem[], ...items),
            }) as Partial<TState>;
    }

    public toggle(item: TItem): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.toggle(state[this.key] as TItem[], item),
            }) as Partial<TState>;
    }

    public remove(...items: TItem[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.remove(state[this.key] as TItem[], ...items),
            }) as Partial<TState>;
    }

    public removeWhere(query: Predicate<TItem>): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.removeWhere(state[this.key] as TItem[], query),
            }) as Partial<TState>;
    }

    public removeAt(...indexes: number[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.removeAt(state[this.key] as TItem[], ...indexes),
            }) as Partial<TState>;
    }

    public move(item: TItem, index: number): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.move(state[this.key] as TItem[], item, index),
            }) as Partial<TState>;
    }

    public moveAt(fromIndex: number, toIndex: number): Update<TState> {
        return (state) =>
            ({
                [this.key]: $Array.moveAt(state[this.key] as TItem[], fromIndex, toIndex),
            }) as Partial<TState>;
    }
}
