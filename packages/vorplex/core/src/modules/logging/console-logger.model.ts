import { Logger } from './logger.model';

export class Chalk {
    public static readonly Reset = '\u001b[0m' as const;
    public static readonly Normal = '\u001b[22m' as const;
    public static readonly Bright = '\u001b[1m' as const;
    public static readonly Dim = '\u001b[2m' as const;
    public static readonly Underscore = '\u001b[4m' as const;
    public static readonly Blink = '\u001b[5m' as const;
    public static readonly Reverse = '\u001b[7m' as const;
    public static readonly Hidden = '\u001b[8m' as const;

    public static readonly Black = '\u001b[30m' as const;
    public static readonly Red = '\u001b[31m' as const;
    public static readonly Green = '\u001b[32m' as const;
    public static readonly Yellow = '\u001b[33m' as const;
    public static readonly Orange = '\u001b[38;5;172m' as const;
    public static readonly Blue = '\u001b[34m' as const;
    public static readonly Magenta = '\u001b[35m' as const;
    public static readonly Cyan = '\u001b[36m' as const;
    public static readonly White = '\u001b[37m' as const;

    public static readonly DarkGray = '\u001b[38;5;244m' as const;
    public static readonly Gray = '\u001b[38;5;247m' as const;

    public static readonly BlackBackground = '\u001b[40m' as const;
    public static readonly RedBackground = '\u001b[41m' as const;
    public static readonly GreenBackground = '\u001b[42m' as const;
    public static readonly YellowBackground = '\u001b[43m' as const;
    public static readonly BlueBackground = '\u001b[44m' as const;
    public static readonly MagentaBackground = '\u001b[45m' as const;
    public static readonly CyanBackground = '\u001b[46m' as const;
    public static readonly WhiteBackground = '\u001b[47m' as const;

    public static hue(hue: number) {
        return `\u001b[38;5;${hue}m`;
    }
}

export class ConsoleLogger extends Logger {
    public log(...message: string[]) {
        console.log([Chalk.DarkGray, ...message, Chalk.Reset].join(''));
    }

    public warn(...message: string[]) {
        console.warn([Chalk.Orange, ...message, Chalk.Reset].join(''));
    }

    public error(error: string | Error) {
        console.error([Chalk.Red, error instanceof Error ? error.message : error, Chalk.Reset].join(''));
    }
}
