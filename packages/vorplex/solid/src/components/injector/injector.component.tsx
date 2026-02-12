import { Injector, type Instance, type Type } from '@vorplex/core';
import { createContext, type JSX, useContext } from 'solid-js';

export const InjectorContext = createContext(new Injector());

export function useInjector<T extends any[]>(map: T): { [K in keyof T]: Instance<T[K]> };
export function useInjector<T extends Record<string, Type>>(map: T): Instance<T>;
export function useInjector<T extends any[] | Record<string, Type>>(map: T): Instance<T> | { [K in keyof T]: Instance<T[K]> } {
    const injector = useContext(InjectorContext);
    if (Array.isArray(map)) {
        return (map as any[]).map((type) => injector.get(type)) as any;
    } else {
        return injector.map(map as Record<string, Type>) as any;
    }
}

export function InjectorComponent(props: { inject?: (injector: Injector) => Injector; children: JSX.Element | ((injector: Injector) => JSX.Element) }) {
    let injector = useContext(InjectorContext).scope();
    injector = props.inject?.(injector) ?? useContext(InjectorContext).scope();
    return (
        <InjectorContext.Provider value={injector}>{typeof props.children === 'function' ? props.children(injector) : props.children}</InjectorContext.Provider>
    );
}
