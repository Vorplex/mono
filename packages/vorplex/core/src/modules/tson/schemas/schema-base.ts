import { $String } from '../../string/string.util';
import { TsonError } from '../error';

export interface TsonDefinitionBase<T = any> {
    readonly type: string;
    default?: T;
    description?: string;
}

export abstract class TsonSchemaBase<T = any> {
    public definition: TsonDefinitionBase<T>;

    protected parseDefault(value: any): boolean {
        if (value == null) {
            if (this.definition.default === undefined) throw new TsonError(`${$String.upperCaseFirst(this.definition.type)} required`, value, this as any);
            else return true;
        }
        return false;
    }

    public abstract accepts(tson: TsonDefinitionBase | null | undefined): boolean;
    public abstract parse(value: any): T;
    public abstract getDefault(): T;
}
