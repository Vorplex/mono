import { $Id } from '../../id/id.util';

export abstract class Attribute<T = any> {
    public data?: T;

    /** The key used to store the metadata. */
    public readonly key: string;
    /** The prototype which the attribute is applied to. */
    public prototype: object;

    constructor(prototype: object, data?: T) {
        this.prototype = prototype;
        this.key = $Id.uuid();
        this.data = data;
    }

    /** Executed when the attribute is applied. */
    public onAttributeInit(): void { }

    /** Executed when the attribute is removed. */
    public onAttributeDestroy(): void { }
}
