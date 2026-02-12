export class $Date {
    public static addMilliseconds(date: Date, ms: number): Date {
        return new Date(date.getTime() + ms);
    }

    public static addSeconds(date: Date, seconds: number): Date {
        return $Date.addMilliseconds(date, seconds * 1_000);
    }

    public static addMinutes(date: Date, minutes: number): Date {
        return $Date.addMilliseconds(date, minutes * 60_000);
    }

    public static addHours(date: Date, hours: number): Date {
        return $Date.addMilliseconds(date, hours * 3_600_000);
    }

    public static addDays(date: Date, days: number): Date {
        return $Date.addMilliseconds(date, days * 86_400_000);
    }

    public static addWeeks(date: Date, weeks: number): Date {
        return $Date.addDays(date, weeks * 7);
    }

    public static addMonths(date: Date, months: number): Date {
        date = new Date(date.getTime());
        date.setMonth(date.getMonth() + months);
        return date;
    }

    public static addYears(date: Date, years: number): Date {
        date = new Date(date.getTime());
        date.setFullYear(date.getFullYear() + years);
        return date;
    }

    /**
     *
     * @param date
     * @param format
     * @returns
     * @example
     * // 12 Jan 2025 11:50:15
     * `YYYY` = 2025
     * `YY` = 25
     * `MM` = 01
     * `DD` = 12
     * `hh` = 11
     * `mm` = 50
     * `ss` = 15
     */
    public static format(date: Date, format: string): string {
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format.replace('YYYY', year).replace('YY', year.slice(-2)).replace('MM', month).replace('DD', day).replace('hh', hours).replace('mm', minutes).replace('ss', seconds);
    }

    /**
     *
     * @param target
     * @param compareTo
     * @returns
     * @example
     * // 5 days ago
     * // 1 minute from now
     */
    public static toAgoString(target: Date, compareTo: Date = new Date()): string {
        const msDiff = compareTo.getTime() - target.getTime();
        const seconds = Math.floor(Math.abs(msDiff) / 1000);

        const epochs = [
            { name: 'year', seconds: 31_536_000 },
            { name: 'month', seconds: 2_592_000 },
            { name: 'week', seconds: 604_800 },
            { name: 'day', seconds: 86_400 },
            { name: 'hour', seconds: 3_600 },
            { name: 'minute', seconds: 60 },
            { name: 'second', seconds: 0 },
        ];

        const epoch = epochs.find((e) => e.seconds <= seconds);
        const count = Math.floor(seconds / (epoch.seconds || 1));
        const unit = count === 1 ? epoch.name : `${epoch.name}s`;
        const when = msDiff > 0 ? 'ago' : 'from now';
        return `${count} ${unit} ${when}`;
    }

    public static isValid(date: unknown): date is Date {
        return date instanceof Date && !Number.isNaN(date.getTime());
    }
}
