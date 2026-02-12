import { Attribute } from './attribute.model';

export abstract class ClassAttribute<T = any> extends Attribute<T> {
    constructor(constructor: Function, data?: T) {
        super(constructor.prototype, data);
    }
}
