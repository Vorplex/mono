import { Action } from './action.interface';

export interface Hub {
    name: string;
    actions: Action[];
}
