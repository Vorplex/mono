export abstract class Logger {
    public static readonly empty: Logger = {
        log: () => {},
        warn: () => {},
        error: () => {},
    };

    public abstract log(...message: string[]): void;
    public abstract warn(message: string): void;
    public abstract error(error: string | Error): void;
}
