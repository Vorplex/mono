import { $Tson, Injectable } from '@vorplex/core';
import { DrxDocument, DrxDocumentState, DrxType } from '@vorplex/drx';
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
        variables: (interfaceName: string, variableIds: string[], state: DrxDocumentState, types: DrxType[]): string => {
            let definition = '';
            for (const id of variableIds) {
                const variable = state.variables[id];
                definition += `
                    interface ${interfaceName} {
                        '${variable.name}': DrxVariableApi<${$Tson.generateTypeScriptDefinition(DrxType.resolve(variable.type, types))}>;
                    }
                `;
            }
            return definition;
        },
        apis: (interfaceName: string, apiIds: string[], state: DrxDocumentState, types: DrxType[]): string => {
            let definition = '';
            for (const apiId of apiIds) {
                const api = state.apis[apiId];
                let endpoints = '';
                for (const endpointId of api.endpointIds) {
                    const endpoint = state.apiEndpoints[endpointId];
                    const parameters = endpoint.parameterIds.map(id => state.apiParameters[id]).map(p => `'${p.name}'${p.required ? '' : '?'}: string`).join('; ');
                    const headers = endpoint.headerIds.map(id => state.apiHeaders[id]).map(h => `'${h.name}'${h.required ? '' : '?'}: string`).join('; ');
                    const bodyType = endpoint.bodyId ? $Tson.generateTypeScriptDefinition(DrxType.resolve(state.apiBodies[endpoint.bodyId].type, types)) : 'any';
                    const responseType = endpoint.responseId ? $Tson.generateTypeScriptDefinition(DrxType.resolve(state.apiResponses[endpoint.responseId].type, types)) : 'any';
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
        componentProps: (propertyIds: string[], state: DrxDocumentState, types: DrxType[]): string => {
            let definition = '';
            for (const id of propertyIds) {
                const property = state.componentProperties[id];
                definition += `
                    interface DrxComponentProps {
                        '${property.name}': () => ${$Tson.generateTypeScriptDefinition(DrxType.resolve(property.type, types))};
                    }
                `;
            }
            return definition;
        },
        componentEvents: (eventIds: string[], state: DrxDocumentState, types: DrxType[]): string => {
            let definition = '';
            for (const id of eventIds) {
                const event = state.componentEvents[id];
                definition += `
                    interface DrxComponentEvents {
                        '${event.name}': {
                            emit(payload?: ${$Tson.generateTypeScriptDefinition(DrxType.resolve(event.type, types))}): void;
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
        const appTypes = app.typeIds.map(id => state.types[id]);

        const definitions = [
            this.types.variables('DrxAppVariables', app.variableIds, state, appTypes),
            this.types.apis('DrxAppApis', app.apiIds, state, appTypes),
            this.types.services('DrxAppServices', app.serviceIds, state),
            this.types.pages(app.pageIds, state)
        ];

        if (target.type === 'page') {
            const page = state.pages[target.pageId];
            definitions.push(this.types.variables('DrxPageVariables', page.variableIds, state, appTypes));
        } else if (target.type === 'component') {
            const component = state.components[target.componentId];
            const componentTypes = component.typeIds.map(id => state.types[id]);
            definitions.push(
                this.types.variables('DrxComponentVariables', component.variableIds, state, componentTypes),
                this.types.componentProps(component.propertyIds, state, componentTypes),
                this.types.componentEvents(component.eventIds, state, componentTypes),
                this.types.apis('DrxComponentApis', component.apiIds, state, componentTypes),
                this.types.services('DrxComponentServices', component.serviceIds, state)
            );
        } else if (target.type === 'service') {
            const owningComponent = Object.values(state.components).find(component => component.serviceIds.includes(target.serviceId));
            definitions.push(this.types.services('DrxServiceServices', owningComponent ? owningComponent.serviceIds : app.serviceIds, state));
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
        return { dispose: () => disposables.forEach(disposable => disposable.dispose()) };
    }
}
