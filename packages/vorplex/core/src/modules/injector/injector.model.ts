
import type { Constructor } from '../reflection/types/constructor.type';
import { Instance } from '../reflection/types/instance.type';
import type { Type } from '../reflection/types/type.type';
import { $Decorator } from '../reflection/utils/decorator.util';
import { $Reflection } from '../reflection/utils/reflection.util';
import { InjectableDecorator } from './decorators/injectable.decorator';
import { ProviderScopes } from './provider-scopes.enum';
import type { IProvider, Provider } from './provider.interface';

export class InjectorError extends Error { }

export class Injector {
    public static providers: IProvider[] = [];
    public providers: IProvider[] = [];
    public parentInjector: Injector;

    constructor(providers: Provider[] = [], parentInjector?: Injector) {
        this.providers = providers.map((provider) => Injector.parseProvider(provider));
        this.parentInjector = parentInjector;
    }

    public static parseProvider(value: Provider): IProvider {
        if ($Reflection.isType(value)) {
            const decorator = $Decorator.get({
                target: value,
                type: InjectableDecorator,
                first: true,
            });
            return {
                scope: decorator?.data.scope ?? ProviderScopes.Singleton,
                type: value,
            };
        } else {
            const provider = value as IProvider;
            const decorator = $Decorator.get({
                target: provider.type,
                type: InjectableDecorator,
                first: true,
            });
            provider.scope ??= decorator?.data.scope ?? ProviderScopes.Singleton;
            return provider;
        }
    }

    private getProvider(type: Type): IProvider {
        for (const provider of this.providers) {
            if ($Reflection.extends(provider.type, type)) {
                return provider;
            }
        }
    }

    private getGlobalProvider(type: Type): IProvider {
        const injectable = $Decorator.get({
            target: type,
            type: InjectableDecorator,
            first: true,
        });
        if (injectable?.data.global) {
            let provider = Injector.providers.find((provider) => $Reflection.extends(provider.type, type));
            if (!provider) {
                provider = Injector.parseProvider(type);
                Injector.providers.push(provider);
            }
            return provider;
        }
    }

    public create<T = any>(type: Constructor<T>): T {
        if ('inject' in type && typeof type.inject === 'object' && type.inject != null) {
            const inject = type.inject;
            const resolved = new Map<string, any>();
            const proxy = new Proxy({}, {
                get: (_target, key) => {
                    if (typeof key !== 'string' || !(key in inject)) return undefined;
                    if (resolved.has(key)) return resolved.get(key);
                    const dependencyType = inject[key]();
                    try {
                        resolved.set(key, this.get(dependencyType));
                    } catch (error) {
                        if (error instanceof InjectorError) {
                            throw new InjectorError(`Failed to resolve dependency of type (${$Reflection.getTypeName(dependencyType)}) on type (${$Reflection.getTypeName(type)}). ${error.message}`);
                        }
                        throw error;
                    }
                    return resolved.get(key);
                }
            });
            return new type(proxy);
        }
        return new type();
    }

    private createProviderInstance(provider: IProvider, scope: ProviderScopes = ProviderScopes.Singleton): any {
        if (provider.value == null || provider.scope === ProviderScopes.Transient || (scope === ProviderScopes.Transient && provider.scope !== ProviderScopes.Singleton) || (scope === ProviderScopes.Scoped && provider.scope !== ProviderScopes.Singleton)) {
            if (provider.factory) {
                return provider.factory(this);
            } else if ($Reflection.isType(provider.type)) {
                return this.create(provider.type as Constructor);
            } else {
                throw new InjectorError(`Unable to create provider instance ${$Reflection.getTypeName(provider.type)}. Type is not constructable or factory is not provided`);
            }
        }
        return provider.value;
    }

    public get<T = any>(type: Type<T>, optional?: boolean): T {
        if (type === Injector) {
            return this as any;
        } else if (type === Object) {
            throw new InjectorError('Unable to resolve provider for anonymous type.');
        } else {
            const provider = this.getProvider(type) ?? this.parentInjector?.getProvider(type) ?? this.getGlobalProvider(type);
            if (provider) {
                provider.value = this.createProviderInstance(provider);
                return provider.value;
            } else if (!optional) {
                throw new InjectorError(`No provider registered for type (${$Reflection.getTypeName(type)}).`);
            }
        }
    }

    public map<T extends Record<string, Type<T>>>(map: T): { [key in keyof T]: Instance<T[key]> } {
        return Object.keys(map).reduce((result, key) => ({ ...result, [key]: this.get(map[key]) }), {}) as { [key in keyof T]: Instance<T[key]> };
    }

    public add(...providers: Provider[]): Injector {
        for (const provider of providers.map(Injector.parseProvider)) {
            this.providers = [...this.providers.filter((_provider) => !$Reflection.extends(provider.type, _provider.type)), provider];
        }
        return this;
    }

    public addInstance(...instances: any[]): Injector {
        for (const instance of instances) {
            const type = $Reflection.getType(instance);
            this.add({
                scope: ProviderScopes.Singleton,
                type,
                value: instance,
            });
        }
        return this;
    }

    public addDefault(...providers: Provider[]): Injector {
        for (const provider of providers.map(Injector.parseProvider)) {
            if (!this.getProvider(provider.type)) {
                this.add(provider);
            }
        }
        return this;
    }

    public scope(...instances: any[]) {
        const providers: IProvider[] = [];
        for (const provider of this.providers) {
            if (provider.scope !== ProviderScopes.Singleton) {
                providers.push({
                    ...provider,
                    value: this.createProviderInstance(provider, ProviderScopes.Scoped),
                });
            }
        }
        const scope = new Injector(providers, this.parentInjector ?? this);
        scope.addInstance(...instances);
        return scope;
    }
}
