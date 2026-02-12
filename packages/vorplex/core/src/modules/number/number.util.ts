import type { Unit } from '../../consts/unit.const';

export class $Number {
    public static snap(number: number, value?: number): number {
        return Math.floor(number / value) * value;
    }

    public static toUnitString(number: number, units: Record<string, number> | typeof Unit): string {
        const sortedUnits = Object.entries(units).sort(([, a], [, b]) => b - a);
        for (const [unitName, unitValue] of sortedUnits) {
            const converted = number / unitValue;
            if (converted >= 1 || unitValue === sortedUnits[sortedUnits.length - 1][1]) {
                const formatted = Number(converted.toFixed(2));
                return `${formatted} ${unitName}`;
            }
        }
    }

    public static round(number: number, decimals?: number): number {
        return Math.round(number * 10 ** decimals) / 10 ** decimals;
    }

    public static min(value: number, min: number) {
        return Math.max(value, min);
    }

    public static max(value: number, max: number) {
        return Math.min(value, max);
    }

    public static clamp(number: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, number));
    }
}
