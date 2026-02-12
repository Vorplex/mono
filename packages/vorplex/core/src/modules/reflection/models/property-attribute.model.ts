import { Attribute } from './attribute.model';

export abstract class PropertyAttribute<T = any> extends Attribute<T> {
    public property: string;

    constructor(prototype: object, property: string, data?: T) {
        super(prototype, data);
        this.property = property;
    }
}
