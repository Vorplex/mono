import type { Type } from '../../reflection/types/type.type';
import { $Decorator, ConstructorParameterDecorator } from '../../reflection/utils/decorator.util';

export type InjectDecoratorData = {
    type: Type;
    optional?: boolean;
};

export class InjectDecorator extends ConstructorParameterDecorator<InjectDecoratorData> { }

export function Inject(args: { type: Type; optional?: boolean; index: number; name: string }) {
    return $Decorator.createClassDecorator((type) => {
        const data: InjectDecoratorData = {
            type: args.type,
            optional: args.optional,
        };
        return new InjectDecorator(type, { index: args.index, name: args.name }, data);
    });
}
