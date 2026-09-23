import { ModuleLoader } from '@vorplex/compiler';
import { $String } from '@vorplex/core';
import { DrxDocumentState, DrxScope } from './drx';
import { DrxApi } from './node/api/api';

const createScriptDefault = (define: string) => $String.dedent(`
    export default DRX.${define}(drx => class {
        onMount() {

        }
        onUnmount() {

        }
    });
`);

export const DrxScripting = {
    defaults: {
        app: createScriptDefault('defineApp'),
        page: createScriptDefault('definePage'),
        component: createScriptDefault('defineComponent'),
        service: 'export default DRX.defineService(drx => class {\n\n});\n'
    } as const,
    instantiate(bundle: string, id: string, drx: any): any {
        if (!id || !bundle) return undefined;
        const module = ModuleLoader.evaluate(bundle, {
            DRX: {
                defineApp: (factory: any) => factory,
                definePage: (factory: any) => factory,
                defineComponent: (factory: any) => factory,
                defineService: (factory: any) => factory
            }
        });
        const factory = module?.default?.[id];
        return factory?.(drx);
    },
    getFunctionLocals(instance: any): Record<string, any> {
        if (!instance) return {};
        const prototype = Object.getPrototypeOf(instance);
        return Object
            .getOwnPropertyNames(prototype)
            .filter(name => name !== 'constructor' && typeof instance[name] === 'function')
            .reduce((methods, name) => Object.assign(methods, { [name]: instance[name].bind(instance) }), {});
    },
    instantiateServices(serviceIds: string[], state: DrxDocumentState, bundle: string, instances = new Map<string, any>(), scope: DrxScope): Record<string, any> {
        const api: Record<string, any> = {};
        for (const serviceId of serviceIds) {
            const service = state.services[serviceId];
            Object.defineProperty(api, service.name, { get: () => instances.get(serviceId), enumerable: true });
        }
        const apis = DrxApi.createApi(state, scope);
        for (const serviceId of serviceIds) {
            if (instances.has(serviceId)) continue;
            const service = state.services[serviceId];
            const ServiceClass = DrxScripting.instantiate(bundle, service.id, { apis, services: api });
            instances.set(serviceId, ServiceClass ? new ServiceClass() : undefined);
        }
        return api;
    }
};
