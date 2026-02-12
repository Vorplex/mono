import { Attribute } from './attribute.model';

export abstract class MethodAttribute<T = any> extends Attribute<T> {
    public method: string;

    constructor(prototype: object, method: string, data?: T) {
        super(prototype, data);
        this.method = method;
    }
}
