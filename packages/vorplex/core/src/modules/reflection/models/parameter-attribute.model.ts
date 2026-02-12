import { Attribute } from './attribute.model';

export abstract class ParameterAttribute<T = any> extends Attribute<T> {
    public method: string;
    public name: string;
    public index: number;

    constructor(prototype: object, method: string, index: number, data?: T) {
        super(prototype, data);
        this.method = method;
        this.name = (prototype[method] || prototype)
            .toString()
            .replace(/[/][/].*$/gm, '')
            .replace(/\s+/g, '')
            .replace(/[/][*][^/*]*[*][/]/g, '')
            .split('){', 1)[0]
            .replace(/^[^(]*[(]/, '')
            .replace(/=[^,]+/g, '')
            .split(',')
            .filter(Boolean)[index];
        this.index = index;
    }
}
