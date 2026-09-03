import { $Tson, Injectable } from '@vorplex/core';
import { ShtmlDocument, ShtmlDocumentState, ShtmlType } from '@vorplex/shtml';
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
interface ShtmlVariableApi<T = any> {
    get(): T;
    set(update: T | ((value: T) => T)): void;
    reset(): void;
    validate(): [value: T | undefined, errors: unknown[]];
}
interface ShtmlApiRequestResult<TResponse = any> {
    raw: Response;
    value(): Promise<TResponse>;
}
interface ShtmlRouterApi {
    navigate(route: string): void;
    readonly route: string;
    readonly params: Record<string, string>;
}
interface ShtmlModalApi {
    readonly data: any;
    close(result?: any): void;
}

interface ShtmlAppVariables {}
interface ShtmlAppApis {}
interface ShtmlAppServices {}
interface ShtmlPages {}
interface ShtmlPageVariables {}
interface ShtmlComponentVariables {}
interface ShtmlComponentProps {}
interface ShtmlComponentEvents {}
interface ShtmlComponentApis {}
interface ShtmlComponentServices {}
interface ShtmlServiceServices {}

declare const Shtml: {
    defineApp<T extends (shtml: {
        app: { variables: ShtmlAppVariables; readonly instance: any };
        apis: ShtmlAppApis;
        services: ShtmlAppServices;
        router: ShtmlRouterApi;
        pages: ShtmlPages;
        modal: ShtmlModalApi;
    }) => new (...args: any[]) => any>(factory: T): T;
    definePage<T extends (shtml: {
        app: { variables: ShtmlAppVariables; readonly instance: ShtmlAppInstance };
        page: { variables: ShtmlPageVariables };
        apis: ShtmlAppApis;
        services: ShtmlAppServices;
        router: ShtmlRouterApi;
        pages: ShtmlPages;
        modal: ShtmlModalApi;
    }) => new (...args: any[]) => any>(factory: T): T;
    defineComponent<T extends (shtml: {
        component: { variables: ShtmlComponentVariables; props: ShtmlComponentProps; events: ShtmlComponentEvents };
        apis: ShtmlComponentApis;
        services: ShtmlComponentServices;
    }) => new (...args: any[]) => any>(factory: T): T;
    defineService<T extends (shtml: { apis: {}; services: ShtmlServiceServices }) => new (...args: any[]) => any>(factory: T): T;
};
`;

@Injectable({ global: true })
export class IntellisenseService {

    public readonly types = {
        variables: (interfaceName: string, variableIds: string[], state: ShtmlDocumentState, types: ShtmlType[]): string => {
            let definition = '';
            for (const id of variableIds) {
                const variable = state.variables[id];
                definition += `
                    interface ${interfaceName} {
                        '${variable.name}': ShtmlVariableApi<${$Tson.generateTypeScriptDefinition(ShtmlType.resolve(variable.type, types))}>;
                    }
                `;
            }
            return definition;
        },
        apis: (interfaceName: string, apiIds: string[], state: ShtmlDocumentState, types: ShtmlType[]): string => {
            let definition = '';
            for (const apiId of apiIds) {
                const api = state.apis[apiId];
                let endpoints = '';
                for (const endpointId of api.endpointIds) {
                    const endpoint = state.apiEndpoints[endpointId];
                    const parameters = endpoint.parameterIds.map(id => state.apiParameters[id]).map(p => `'${p.name}'${p.required ? '' : '?'}: string`).join('; ');
                    const headers = endpoint.headerIds.map(id => state.apiHeaders[id]).map(h => `'${h.name}'${h.required ? '' : '?'}: string`).join('; ');
                    const bodyType = endpoint.bodyId ? $Tson.generateTypeScriptDefinition(ShtmlType.resolve(state.apiBodies[endpoint.bodyId].type, types)) : 'any';
                    const responseType = endpoint.responseId ? $Tson.generateTypeScriptDefinition(ShtmlType.resolve(state.apiResponses[endpoint.responseId].type, types)) : 'any';
                    endpoints += `    '${endpoint.name}': { request(options?: { parameters?: { ${parameters} }; headers?: { ${headers} }; body?: ${bodyType} }): Promise<ShtmlApiRequestResult<${responseType}>> };\n`;
                }
                definition += `interface ${interfaceName} { '${api.name}': {\n${endpoints}} }\n`;
            }
            return definition;
        },
        pages: (pageIds: string[], state: ShtmlDocumentState): string => {
            let definition = '';
            for (const id of pageIds) {
                definition += `
                    interface ShtmlPages {
                        '${state.pages[id].name}': {
                            show(): void;
                            showModal(options?: { data?: any }): Promise<any>;
                        };
                    }
                `;
            }
            return definition;
        },
        services: (interfaceName: string, serviceIds: string[], state: ShtmlDocumentState): string => {
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
        componentProps: (propertyIds: string[], state: ShtmlDocumentState, types: ShtmlType[]): string => {
            let definition = '';
            for (const id of propertyIds) {
                const property = state.componentProperties[id];
                definition += `
                    interface ShtmlComponentProps {
                        '${property.name}': () => ${$Tson.generateTypeScriptDefinition(ShtmlType.resolve(property.type, types))};
                    }
                `;
            }
            return definition;
        },
        componentEvents: (eventIds: string[], state: ShtmlDocumentState, types: ShtmlType[]): string => {
            let definition = '';
            for (const id of eventIds) {
                const event = state.componentEvents[id];
                definition += `
                    interface ShtmlComponentEvents {
                        '${event.name}': {
                            emit(payload?: ${$Tson.generateTypeScriptDefinition(ShtmlType.resolve(event.type, types))}): void;
                        };
                    }
                `;
            }
            return definition;
        }
    };

    public async registerIntellisense(shtml: ShtmlDocument, target: IntellisenseTarget): Promise<IDisposable> {
        const { monaco } = useInjector({ monaco: MonacoService });
        const state = shtml.state.value;
        const app = state.app;
        const appTypes = app.typeIds.map(id => state.types[id]);

        const definitions = [
            this.types.variables('ShtmlAppVariables', app.variableIds, state, appTypes),
            this.types.apis('ShtmlAppApis', app.apiIds, state, appTypes),
            this.types.services('ShtmlAppServices', app.serviceIds, state),
            this.types.pages(app.pageIds, state)
        ];

        if (target.type === 'page') {
            const page = state.pages[target.pageId];
            definitions.push(this.types.variables('ShtmlPageVariables', page.variableIds, state, appTypes));
        } else if (target.type === 'component') {
            const component = state.components[target.componentId];
            const componentTypes = component.typeIds.map(id => state.types[id]);
            definitions.push(
                this.types.variables('ShtmlComponentVariables', component.variableIds, state, componentTypes),
                this.types.componentProps(component.propertyIds, state, componentTypes),
                this.types.componentEvents(component.eventIds, state, componentTypes),
                this.types.apis('ShtmlComponentApis', component.apiIds, state, componentTypes),
                this.types.services('ShtmlComponentServices', component.serviceIds, state)
            );
        } else if (target.type === 'service') {
            const owningComponent = Object.values(state.components).find(component => component.serviceIds.includes(target.serviceId));
            definitions.push(this.types.services('ShtmlServiceServices', owningComponent ? owningComponent.serviceIds : app.serviceIds, state));
        }

        const hasAppScript = !!app.script?.trim();
        const models: IntellisenseModel[] = [
            ...(hasAppScript ? [{ uri: 'file:///app-script.ts', content: app.script! }] : []),
            {
                uri: 'file:///app-instance-type.ts',
                content: hasAppScript
                    ? `import AppScriptFactory from './app-script.ts'; declare global { type ShtmlAppInstance = InstanceType<ReturnType<typeof AppScriptFactory>>; }`
                    : `declare global { type ShtmlAppInstance = any; }`
            }
        ];

        const disposables: IDisposable[] = [];
        for (const model of models) disposables.push(await monaco.createVirtualModel(model.uri, model.content));
        disposables.push(await monaco.setGlobalLibrary([SCRIPT_TYPES, ...definitions].join('\n\n')));
        return { dispose: () => disposables.forEach(disposable => disposable.dispose()) };
    }
}
