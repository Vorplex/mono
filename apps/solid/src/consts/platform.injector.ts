import { Injector, ProviderScopes } from '@vorplex/core';
import { PlatformService } from '../services/platform.service';

export const PlatformInjector = new Injector()
    .add({ type: PlatformService, scope: ProviderScopes.Singleton });