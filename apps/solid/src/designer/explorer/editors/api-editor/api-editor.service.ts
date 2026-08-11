import { Injectable, State } from '@vorplex/core';

export interface ApiEditorState {
    selectedEndpointId?: string;
}

@Injectable({ global: true })
export class ApiEditorService {

    public readonly state = new State<ApiEditorState>({
    });

}