import type { KeyValue } from '../../interfaces/key-value.interface';
import { $Reflection } from '../reflection/utils/reflection.util';

export class $Enum {
    public static getFlags(target: any, value: number): string[] {
        return $Enum
            .getItems(target)
            .filter((item) => $Enum.hasFlag(value, item.value as number))
            .map((item) => item.key);
    }

    public static addFlag(value: number, flag: number): number {
        return value | flag;
    }

    public static removeFlag(value: number, flag: number): number {
        return value & ~flag;
    }

    public static toggleFlag(value: number, flag: number): number {
        return $Enum.hasFlag(value, flag) ? $Enum.removeFlag(value, flag) : $Enum.addFlag(value, flag);
    }

    public static hasFlag(value: any, flag: number): boolean {
        return value != null && flag != null && ((value === 0 && value === flag) || (value & flag) === flag);
    }

    public static switchFlags(value: any, ...cases: [...number[], (value: number) => void][]) {
        for (const statement of cases) {
            for (let i = 0; i < statement.length - 1; i++) {
                if ($Enum.hasFlag(value, Number(statement[i]))) {
                    (statement[statement.length - 1] as any)(value);
                    break;
                }
            }
        }
    }

    public static isNumeric(target: any): boolean {
        return $Reflection.isObject(target) && Object.keys(target).every((key) => (Number.isFinite(Number(key)) || typeof target[key] === 'number') && String(target[key]) in target);
    }

    public static isNonNumeric(target: any): boolean {
        return $Reflection.isObject(target) && Object.keys(target).every((key) => !Number.isFinite(Number(key)) && typeof target[key] === 'string');
    }

    public static isEnum(target: any): boolean {
        return $Enum.isNumeric(target) || $Enum.isNonNumeric(target);
    }

    public static getItems<T extends string | number = string | number>(target: any): KeyValue<T>[] {
        const items: KeyValue<T>[] = [];
        if ($Enum.isNumeric(target)) {
            for (const key in target) {
                if (typeof target[key] === 'number') {
                    items.push({ key, value: target[key] as T });
                }
            }
        } else {
            for (const key in target) {
                items.push({ key, value: target[key] });
            }
        }
        return items;
    }

    public static getValues(target: any): any[] {
        return $Enum.getItems(target).map((iItem) => iItem.value);
    }

    public static getKeys(target: any): string[] {
        return $Enum.getItems(target).map((iItem) => iItem.key);
    }

    public static getValueKey(target: any, value: number | string) {
        const item = $Enum.getItems(target).find((iEntry) => iEntry.value === value);
        return item ? item.key : typeof value === 'number' ? value : null;
    }

    public static getValue(target: any, name: string | number): number | string {
        return target[name];
    }
}
