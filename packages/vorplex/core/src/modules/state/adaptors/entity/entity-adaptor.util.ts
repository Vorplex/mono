import type { KeysOfType } from '../../../../types/keys-of-type.type';
import type { Predicate } from '../../../../types/predicate.type';
import { State } from '../../state.model';
import type { Update } from '../../update.type';
import type { EntityMap } from './entity-map.type';
import type { IEntity } from './entity.interface';

export class MapAdaptor {
    private constructor() { }

    public static delete<T extends Record<string, any>>(records: T, ...keys: (keyof T)[]): T {
        records = { ...records };
        for (const key of keys) {
            delete records[key];
        }
        return records;
    }

    public static set<T extends Record<string, any>>(records: T, items: Partial<T>): T {
        records = { ...records };
        for (const key in items) {
            if (items[key] === undefined) delete records[key];
            else records[key] = items[key] as any;
        }
        return records;
    }

    public static map<T extends Record<string, any>, TT>(records: T, map: (record: T[keyof T]) => [string, TT]): Record<string, TT> {
        return MapAdaptor.fromArray(Object.values(records), map);
    }

    public static fromArray<T, TT>(records: T[], map: (record: T) => [string, TT]): Record<string, TT> {
        return records.reduce((records, record) => {
            const [key, value] = map(record);
            records[key] = value;
            return records;
        }, {});
    }
}

export class EntityAdaptor<TState, TEntity extends IEntity, TKey extends keyof KeysOfType<TState, EntityMap<TEntity>>> {
    constructor(private key: TKey) { }

    public static create<T extends IEntity>(items: EntityMap<T>, ...entities: T[]): EntityMap<T> {
        items = { ...items };
        for (const entity of entities) {
            if (!items[entity.id]) {
                items[entity.id] = entity;
            } else {
                throw new Error(`Entity with ID ${entity.id} already exists.`);
            }
        }
        return items;
    }

    public create(...entities: TEntity[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: EntityAdaptor.create(state[this.key] as EntityMap<TEntity>, ...entities),
            }) as Partial<TState>;
    }

    public static updateAll<T extends IEntity>(items: EntityMap<T>, ...updates: Update<T>[]): EntityMap<T> {
        items = { ...items };
        for (const id in items) {
            items[id] = State.update(items[id], ...updates);
        }
        return items;
    }

    public updateAll(...updates: Update<TEntity>[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: EntityAdaptor.updateAll(state[this.key] as EntityMap<TEntity>, ...updates),
            }) as Partial<TState>;
    }

    public static updateById<T extends IEntity>(items: EntityMap<T>, id: string, ...updates: Update<T>[]): EntityMap<T> {
        items = { ...items };
        return EntityAdaptor.updateByIds(items, [id], ...updates);
    }

    public updateById(id: string, ...updates: Update<TEntity>[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: EntityAdaptor.updateById(state[this.key] as EntityMap<TEntity>, id, ...updates),
            }) as Partial<TState>;
    }

    public static updateByIds<T extends IEntity>(items: EntityMap<T>, ids: string[], ...updates: Update<T>[]): EntityMap<T> {
        items = { ...items };
        for (const id of ids) {
            if (items[id]) {
                items[id] = State.update(items[id], ...updates);
            } else {
                throw new Error(`Entity with ID ${id} doesn't exist.`);
            }
        }
        return items;
    }

    public updateByIds(ids: string[], ...updates: Update<TEntity>[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: EntityAdaptor.updateByIds(state[this.key] as EntityMap<TEntity>, ids, ...updates),
            }) as Partial<TState>;
    }

    public static updateWhere<T extends IEntity>(items: EntityMap<T>, predicate: Predicate<T>, ...updates: Update<T>[]): EntityMap<T> {
        items = { ...items };
        for (const item of Object.values(items).filter(predicate)) {
            items[item.id] = State.update(item, ...updates);
        }
        return items;
    }

    public updateWhere(predicate: Predicate<TEntity>, ...updates: Update<TEntity>[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: EntityAdaptor.updateWhere(state[this.key] as EntityMap<TEntity>, predicate, ...updates),
            }) as Partial<TState>;
    }

    public static upsert<T extends IEntity>(items: EntityMap<T>, ...entities: T[]): EntityMap<T> {
        items = { ...items };
        for (const entity of entities) {
            items[entity.id] = Object.assign({}, items[entity.id], entity);
        }
        return items;
    }

    public static upsertBy<T extends IEntity>(items: EntityMap<T>, predicate: (existing: T, entity: T) => boolean, ...entities: T[]): EntityMap<T> {
        items = { ...items };
        for (const entity of entities) {
            const existing = Object.values(items).find(existing => predicate(existing, entity));
            items[existing?.id ?? entity.id] = Object.assign({}, existing, entity);
        }
        return items;
    }

    public upsertBy(predicate: (existing: TEntity, entity: TEntity) => boolean, ...entities: TEntity[]): Update<TState> {
        return (state) => ({
            [this.key]: EntityAdaptor.upsertBy(state[this.key] as EntityMap<TEntity>, predicate, ...entities),
        }) as Partial<TState>;
    }

    public upsert(...entities: TEntity[]): Update<TState> {
        return (state) => ({
            [this.key]: EntityAdaptor.upsert(state[this.key] as EntityMap<TEntity>, ...entities),
        }) as Partial<TState>;
    }

    public static delete<T extends IEntity>(items: EntityMap<T>, ...ids: string[]): EntityMap<T> {
        items = { ...items };
        for (const id of ids) {
            delete items[id];
        }
        return items;
    }

    public delete(...ids: string[]): Update<TState> {
        return (state) =>
            ({
                [this.key]: EntityAdaptor.delete(state[this.key] as EntityMap<TEntity>, ...ids),
            }) as Partial<TState>;
    }

    public static deleteWhere<T extends IEntity>(items: EntityMap<T>, predicate: Predicate<T>): EntityMap<T> {
        items = { ...items };
        for (const item of Object.values(items)) {
            if (predicate(item)) {
                delete items[item.id];
            }
        }
        return items;
    }

    public deleteWhere(predicate: Predicate<TEntity>): Update<TState> {
        return (state) =>
            ({
                [this.key]: EntityAdaptor.deleteWhere(state[this.key] as EntityMap<TEntity>, predicate),
            }) as Partial<TState>;
    }

    public static fromArray<T extends IEntity>(entities: T[]): EntityMap<T> {
        return entities.reduce((map, entity) => ({ ...map, [entity.id]: entity }), {});
    }
}
