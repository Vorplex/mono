import type { TsonDefinition } from '../schema';
import { type TsonDefinitionBase, TsonSchemaBase } from './schema-base';

export interface TsonAnyDefinition extends TsonDefinitionBase {
    type: 'any';
    default?: any;
}

export class TsonAny extends TsonSchemaBase<any> {
    constructor(
        public definition: TsonAnyDefinition = {
            type: 'any',
        },
    ) {
        super();
    }

    public default(value: any): TsonAny {
        return new TsonAny({
            ...this.definition,
            default: value,
        });
    }

    public getDefault(): any {
        return this.definition.default ?? undefined;
    }

    public accepts(definition: TsonDefinition | null | undefined): boolean {
        return true;
    }

    public parse(value: any): any {
        if (this.parseDefault(value)) return this.definition.default;
        return value;
    }
}
