import { Instance } from '../reflection/types/instance.type';
import { Injectable } from './decorators/injectable.decorator';
import { Injector } from './injector.model';
import { ProviderScopes } from './provider-scopes.enum';

describe(Injector.name, () => {
    describe(Injector.prototype.add.name, () => {
        class Base { }
        class Sample extends Base {
            constructor() {
                super();
            }
        }
        it('should add a provider', () => {
            const injector = new Injector();
            injector.add({ type: Base, scope: ProviderScopes.Singleton }, { type: Sample, scope: ProviderScopes.Singleton });
            expect(injector.providers).toEqual([
                {
                    type: Sample,
                    scope: ProviderScopes.Singleton,
                },
            ]);
        });
    });

    describe(Injector.prototype.addInstance.name, () => {
        class Sample { }
        it('should add an instance', () => {
            const injector = new Injector();
            const instance = new Sample();
            injector.addInstance(instance);
            expect(injector.providers).toEqual([
                {
                    type: Sample,
                    scope: ProviderScopes.Singleton,
                    value: instance,
                },
            ]);
        });
    });

    describe(Injector.prototype.get.name, () => {
        class Base { }
        class Sample extends Base {
            constructor() {
                super();
            }
        }

        it('should return provider', () => {
            const injector = new Injector([{ type: Sample, scope: ProviderScopes.Singleton }]);
            expect(injector.get(Base)).toBeDefined();
            expect(injector.get(Sample)).toBeDefined();
        });

        it('should return transient provider', () => {
            const injector = new Injector();
            injector.add({
                type: Sample,
                scope: ProviderScopes.Transient,
            });
            const a = injector.get(Base);
            const b = injector.get(Sample);
            expect(a).not.toBe(b);
        });

        it('should throw an error if no provider is found', () => {
            const injector = new Injector();
            expect(() => injector.get(Sample)).toThrow();
        });

        it('should provide global providers', () => {
            @Injectable({ global: true })
            class GlobalSample {
                public hash: string;
            }
            const injector = new Injector();
            const result = injector.get(GlobalSample);
            // should add the provider with its instance to the list
            expect(Injector.providers).toEqual([
                {
                    scope: ProviderScopes.Singleton,
                    type: GlobalSample,
                    value: result,
                },
            ]);
            // should have the prototype of the provider
            expect(result).toBeInstanceOf(GlobalSample);
            // should provide the same value since global providers are singleton by default
            result.hash = '123';
            expect(injector.get(GlobalSample).hash === result.hash).toBeTruthy();
        });
    });

    describe(Injector.prototype.create.name, () => {
        class Base { }
        class Sample extends Base {
            constructor() {
                super();
            }
        }
        class Service {
            static inject = {
                sample: Base
            };
            constructor(public services: Instance<typeof Service.inject>) { }
        }

        it('should create instance with providers', () => {
            const injector = new Injector();
            injector.add({ type: Sample, scope: ProviderScopes.Singleton });
            const instance = injector.create(Service);
            expect(instance).toBeDefined();
            expect(instance.services.sample instanceof Sample).toBeTruthy();
        });
    });

    describe(Injector.prototype.scope.name, () => {
        class Sample {
            constructor(public name: string) { }
        }
        class ScopedSample { }
        it('should create a scoped injector', () => {
            const injector = new Injector();
            injector.add({
                type: ScopedSample,
                scope: ProviderScopes.Scoped,
            });
            injector.addInstance(new Sample('a'));
            const scope = injector.scope(new Sample('b'));
            expect(injector.providers).toEqual([
                {
                    type: ScopedSample,
                    scope: ProviderScopes.Scoped,
                },
                {
                    type: Sample,
                    scope: ProviderScopes.Singleton,
                    value: new Sample('a'),
                },
            ]);
            expect(scope.providers).toEqual([
                {
                    type: ScopedSample,
                    scope: ProviderScopes.Scoped,
                    value: {},
                },
                {
                    type: Sample,
                    scope: ProviderScopes.Singleton,
                    value: { name: 'b' },
                },
            ]);
        });
    });
});
