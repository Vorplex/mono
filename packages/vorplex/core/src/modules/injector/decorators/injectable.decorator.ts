import { $Decorator, ClassDecorator } from '../../reflection/utils/decorator.util';
import { ProviderScopes } from '../provider-scopes.enum';

export type InjectableDecoratorData = {
    global?: boolean;
    scope?: ProviderScopes;
};

export class InjectableDecorator extends ClassDecorator<InjectableDecoratorData> { }

export function Injectable(data: InjectableDecoratorData = { scope: ProviderScopes.Singleton }) {
    return $Decorator.createClassDecorator((type) => new InjectableDecorator(type, data));
}
