import type { IEntity } from './entity.interface';

export type EntityMap<T extends IEntity> = { [id: string]: T };
