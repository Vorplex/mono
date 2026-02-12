import type { Type } from '../reflection/types/type.type';
import type { Injector } from './injector.model';
import type { ProviderScopes } from './provider-scopes.enum';

export interface IProvider<T = any> {
    type: Type<T>;
    scope: ProviderScopes;
    value?: T;
    factory?: (injector: Injector) => T;
}

export type Provider<T = any> = Type<T> | IProvider<T>;
