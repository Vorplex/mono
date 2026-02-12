import { PropertyAttribute } from './property-attribute.model';

export abstract class PropertyProxyAttribute<T = any> extends PropertyAttribute<T> {
    /**
     * Acts as a proxy for the getter of the property.
     * @param target The object containing the property.
     */
    public get(target: object) {
        return target;
    }
    /**
     * Acts as a proxy for the setter of the property.
     * @param target The object containing the property.
     * @param value The value to be assigned to the property.
     * @returns The value to be assigned to the property.
     */
    public set(target: object, value: unknown): unknown {
        return value;
    }
}
