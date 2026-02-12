declare const window: any;
declare const process: any;

export function isNodeEnvironment(): boolean {
    return typeof process !== 'undefined' && typeof window === 'undefined';
}
