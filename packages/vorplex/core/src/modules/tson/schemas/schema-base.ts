import { $String } from '../../string/string.util';
import { TsonError, type TsonResult } from '../error';

export interface TsonDefinitionBase<T = any> {
    readonly type: string;
    default?: { value: T };
    description?: string;
}

export abstract class TsonSchemaBase<T = any> {
    public definition: TsonDefinitionBase<T>;

    protected parseDefault(value: any): TsonResult<T> | null {
        if (value != null) return null;
        if (this.definition.default) return [this.definition.default.value, []];
        return [undefined, [new TsonError(`${$String.upperCaseFirst(this.definition.type)} required`, value, this as any)]];
    }

    public abstract accepts(tson: TsonDefinitionBase | null | undefined): boolean;
    public abstract parse(value: any, failFast?: boolean): TsonResult<T>;
}
