import { DependencyTree } from '@vorplex/compiler';
import { $Tson, Injectable } from '@vorplex/core';
import { DrxDocument, DrxDocumentState, DrxType, DrxScope } from '@vorplex/drx';
import { useInjector } from '@vorplex/solid';
import { type IDisposable } from 'monaco-editor';
import { MonacoService } from '../components/script-editor/monaco.service';

interface IntellisenseModel {
    uri: string;
    content: string;
}

export type IntellisenseTarget =
    | { type: 'app' }
    | { type: 'page'; pageId: string }
    | { type: 'component'; componentId: string }
    | { type: 'service'; serviceId: string };

const SCRIPT_TYPES = `
interface DrxVariableApi<T = any> {
    get(): T;
    set(update: T | ((value: T) => T)): void;
    reset(): void;
    validate(): [value: T | undefined, errors: unknown[]];
}
interface DrxApiRequestResult<TResponse = any> {
    raw: Response;
    value(): Promise<TResponse>;
}
interface DrxRouterApi {
    navigate(route: string): void;
    readonly route: string;
    readonly params: Record<string, string>;
}
interface DrxModalApi {
    readonly data: any;
    close(result?: any): void;
}

interface DrxAppVariables {}
interface DrxAppApis {}
interface DrxAppServices {}
interface DrxPages {}
interface DrxPageVariables {}
interface DrxComponentVariables {}
interface DrxComponentProps {}
interface DrxComponentEvents {}
interface DrxComponentApis {}
interface DrxComponentServices {}
interface DrxServiceServices {}

declare const DRX: {
    defineApp<T extends (drx: {
        app: { variables: DrxAppVariables; readonly instance: any };
        apis: DrxAppApis;
        services: DrxAppServices;
        router: DrxRouterApi;
        pages: DrxPages;
        modal: DrxModalApi;
    }) => new (...args: any[]) => any>(factory: T): T;
    definePage<T extends (drx: {
        app: { variables: DrxAppVariables; readonly instance: DrxAppInstance };
        page: { variables: DrxPageVariables };
        apis: DrxAppApis;
        services: DrxAppServices;
        router: DrxRouterApi;
        pages: DrxPages;
        modal: DrxModalApi;
    }) => new (...args: any[]) => any>(factory: T): T;
    defineComponent<T extends (drx: {
        component: { variables: DrxComponentVariables; props: DrxComponentProps; events: DrxComponentEvents };
        apis: DrxComponentApis;
        services: DrxComponentServices;
    }) => new (...args: any[]) => any>(factory: T): T;
    defineService<T extends (drx: { apis: {}; services: DrxServiceServices }) => new (...args: any[]) => any>(factory: T): T;
};
`;

@Injectable({ global: true })
export class IntellisenseService {

    public readonly types = {
        variables: (interfaceName: string, variableIds: string[], state: DrxDocumentState, scope: DrxScope): string => {
            let definition = '';
            for (const id of variableIds) {
                const variable = state.variables[id];
                definition += `
                    interface ${interfaceName} {
                        '${variable.name}': DrxVariableApi<${$Tson.generateTypeScriptDefinition(DrxType.resolve(scope, variable.type, state))}>;
                    }
                `;
            }
            return definition;
        },
        apis: (interfaceName: string, apiIds: string[], state: DrxDocumentState, scope: DrxScope): string => {
            let definition = '';
            for (const apiId of apiIds) {
                const api = state.apis[apiId];
                let endpoints = '';
                for (const endpointId of api.endpointIds) {
                    const endpoint = state.apiEndpoints[endpointId];
                    const parameters = endpoint.parameterIds.map(id => state.apiParameters[id]).map(p => `'${p.name}'${p.required ? '' : '?'}: string`).join('; ');
                    const headers = endpoint.headerIds.map(id => state.apiHeaders[id]).map(h => `'${h.name}'${h.required ? '' : '?'}: string`).join('; ');
                    const bodyType = endpoint.bodyId ? $Tson.generateTypeScriptDefinition(DrxType.resolve(scope, state.apiBodies[endpoint.bodyId].type, state)) : 'any';
                    const responseType = endpoint.responseId ? $Tson.generateTypeScriptDefinition(DrxType.resolve(scope, state.apiResponses[endpoint.responseId].type, state)) : 'any';
                    endpoints += `    '${endpoint.name}': { request(options?: { parameters?: { ${parameters} }; headers?: { ${headers} }; body?: ${bodyType} }): Promise<DrxApiRequestResult<${responseType}>> };\n`;
                }
                definition += `interface ${interfaceName} { '${api.name}': {\n${endpoints}} }\n`;
            }
            return definition;
        },
        pages: (pageIds: string[], state: DrxDocumentState): string => {
            let definition = '';
            for (const id of pageIds) {
                definition += `
                    interface DrxPages {
                        '${state.pages[id].name}': {
                            show(): void;
                            showModal(options?: { data?: any }): Promise<any>;
                        };
                    }
                `;
            }
            return definition;
        },
        services: (interfaceName: string, serviceIds: string[], state: DrxDocumentState): string => {
            let definition = '';
            for (const id of serviceIds) {
                definition += `
                    interface ${interfaceName} {
                        '${state.services[id].name}': any;
                    }
                `;
            }
            return definition;
        },
        componentProps: (propertyIds: string[], state: DrxDocumentState, scope: DrxScope): string => {
            let definition = '';
            for (const id of propertyIds) {
                const property = state.componentProperties[id];
                definition += `
                    interface DrxComponentProps {
                        '${property.name}': () => ${$Tson.generateTypeScriptDefinition(DrxType.resolve(scope, property.type, state))};
                    }
                `;
            }
            return definition;
        },
        componentEvents: (eventIds: string[], state: DrxDocumentState, scope: DrxScope): string => {
            let definition = '';
            for (const id of eventIds) {
                const event = state.componentEvents[id];
                definition += `
                    interface DrxComponentEvents {
                        '${event.name}': {
                            emit(payload?: ${$Tson.generateTypeScriptDefinition(DrxType.resolve(scope, event.type, state))}): void;
                        };
                    }
                `;
            }
            return definition;
        }
    };

    public async registerIntellisense(drx: DrxDocument, target: IntellisenseTarget): Promise<IDisposable> {
        const { monaco } = useInjector({ monaco: MonacoService });
        const state = drx.state.value;
        const app = state.app;
        const appScope: DrxScope = { type: 'app' };

        const definitions = [
            this.types.variables('DrxAppVariables', app.variableIds, state, appScope),
            this.types.apis('DrxAppApis', app.apiIds, state, appScope),
            this.types.services('DrxAppServices', app.serviceIds, state),
            this.types.pages(app.pageIds, state)
        ];

        let packageScope: { packages?: Record<string, string>; dependencyTree?: DependencyTree } = { packages: app.packages, dependencyTree: app.dependencyTree };

        if (target.type === 'page') {
            const page = state.pages[target.pageId];
            definitions.push(this.types.variables('DrxPageVariables', page.variableIds, state, appScope));
        } else if (target.type === 'component') {
            const component = state.components[target.componentId];
            const componentScope: DrxScope = { type: 'component', componentId: target.componentId };
            definitions.push(
                this.types.variables('DrxComponentVariables', component.variableIds, state, componentScope),
                this.types.componentProps(component.propertyIds, state, componentScope),
                this.types.componentEvents(component.eventIds, state, componentScope),
                this.types.apis('DrxComponentApis', component.apiIds, state, componentScope),
                this.types.services('DrxComponentServices', component.serviceIds, state)
            );
            packageScope = { packages: component.packages, dependencyTree: component.dependencyTree };
        } else if (target.type === 'service') {
            const owningComponent = Object.values(state.components).find(component => component.serviceIds.includes(target.serviceId));
            definitions.push(this.types.services('DrxServiceServices', owningComponent ? owningComponent.serviceIds : app.serviceIds, state));
            packageScope = owningComponent ? { packages: owningComponent.packages, dependencyTree: owningComponent.dependencyTree } : packageScope;
        }

        const hasAppScript = !!app.script?.trim();
        const models: IntellisenseModel[] = [
            ...(hasAppScript ? [{ uri: 'file:///app-script.ts', content: app.script! }] : []),
            {
                uri: 'file:///app-instance-type.ts',
                content: hasAppScript
                    ? `import AppScriptFactory from './app-script.ts'; declare global { type DrxAppInstance = InstanceType<ReturnType<typeof AppScriptFactory>>; }`
                    : `declare global { type DrxAppInstance = any; }`
            }
        ];

        const disposables: IDisposable[] = [];
        for (const model of models) disposables.push(await monaco.createVirtualModel(model.uri, model.content));
        disposables.push(await monaco.setGlobalLibrary([SCRIPT_TYPES, ...definitions].join('\n\n')));
        for (const [name, range] of Object.entries(packageScope.packages ?? {})) {
            const version = packageScope.dependencyTree?.[name]?.version ?? range;
            disposables.push(await monaco.loadPackageLibraries(name, version));
        }
        return { dispose: () => disposables.forEach(disposable => disposable.dispose()) };
    }
}
