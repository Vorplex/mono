import { $Enum } from '../enum/enum.util';
import { $Number } from '../number/number.util';
import { $Object } from '../object/object.util';
import type { Color } from './color.type';
import type { ColorData } from './color-data.interface';
import { ColorFormats } from './color-formats.const';
import { Colors } from './colors.const';
import type { HSL } from './hsl.interface';
import type { HSV } from './hsv.interface';
import type { RGB } from './rgb.interface';

export class $Color {
    private constructor() {}

    public static random(format: '#'): string;
    public static random(format: '0x'): number;
    public static random(format: '#' | '0x' = '#'): string | number {
        let hex: string | number = `#${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
        if (format === '0x') hex = $Color.convertHexToHex0(hex);
        return hex;
    }

    public static from(value: Color = '#ffffffff'): ColorData {
        if (!value) {
            return $Color.parse('black');
        } else if ($Color.isRgb(value)) {
            value = value as RGB;
            return {
                hex0: $Color.convertRgbToHex(value, '0x'),
                hex: $Color.convertRgbToHex(value),
                rgb: value,
                hsl: $Color.convertRgbToHsl(value),
                hsv: $Color.convertRgbToHsv(value),
            };
        } else if ($Color.isHsl(value)) {
            value = value as HSL;
            return {
                hex0: $Color.convertHslToHex(value, '0x'),
                hex: $Color.convertHslToHex(value),
                rgb: $Color.convertHslToRgb(value),
                hsl: value,
                hsv: $Color.convertHslToHsv(value),
            };
        } else if ($Color.isHsv(value)) {
            value = value as HSV;
            return {
                hex0: $Color.convertHsvToHex(value, '0x'),
                hex: $Color.convertHsvToHex(value),
                rgb: $Color.convertHsvToRgb(value),
                hsl: $Color.convertHsvToHsl(value),
                hsv: value,
            };
        } else if ($Color.isHex(value)) {
            value = value as string;
            return {
                hex0: $Color.convertHexToHex0(value),
                hex: value,
                rgb: $Color.convertHexToRgb(value),
                hsl: $Color.convertHexToHsl(value),
                hsv: $Color.convertHexToHsv(value),
            };
        } else if (typeof value === 'string' && !value.startsWith('0x')) {
            const hex = $Color.convertNameToHex(value as string);
            return {
                hex0: $Color.convertHexToHex0(hex),
                hex,
                rgb: $Color.convertHexToRgb(hex),
                hsl: $Color.convertHexToHsl(hex),
                hsv: $Color.convertHexToHsv(hex),
            };
        } else {
            const hex = $Color.convertHex0ToHex(value as number);
            return {
                hex0: Number(value),
                hex,
                rgb: $Color.convertHexToRgb(hex),
                hsl: $Color.convertHexToHsl(hex),
                hsv: $Color.convertHexToHsv(hex),
            };
        }
    }

    public static equal(target: Color, value: Color): boolean {
        return $Color.from(target).hex === $Color.from(value).hex;
    }

    public static isRgb(value: Color): boolean {
        return $Object.hasKeys<RGB>(value, 'r', 'g', 'b', 'a');
    }

    public static isHsl(value: Color): boolean {
        return $Object.hasKeys<HSL>(value, 'h', 's', 'l', 'a');
    }

    public static isHsv(value: Color): boolean {
        return $Object.hasKeys<HSV>(value, 'h', 's', 'v', 'a');
    }

    public static isHex(value: Color) {
        return typeof value === 'string' && value.startsWith('#');
    }

    public static convertHexToHex0(hex: string): number {
        return Number(hex?.replace('#', '0x'));
    }

    public static convertHex0ToHex(hex: number): string {
        return hex.toString(16);
    }

    public static convertHexToRgb(hex: string): RGB {
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16),
            a: hex.length > 7 ? parseInt(hex.slice(7, hex.length), 16) / 255 : 1,
        };
    }

    public static convertRgbToCss(rgb: RGB): string {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.round(rgb.a * 100)}%)`;
    }

    public static convertHslToCss(hsl: HSL): string {
        return `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${Math.round(hsl.a * 100)}%)`;
    }

    public static convertRgbToHsl(rgb: RGB): HSL {
        const r = rgb.r / 255,
            g = rgb.g / 255,
            b = rgb.b / 255;
        const max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d) {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                default:
                    h = (r - g) / d + 4;
            }
            h *= 60;
        }
        const l = (max + min) / 2;
        const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
        return { h: Math.round(h), s, l, a: rgb.a };
    }

    public static convertHslToRgb(hsl: HSL): RGB {
        const h = ((hsl.h % 360) + 360) % 360;
        const s = $Number.clamp(hsl.s, 0, 1),
            l = $Number.clamp(hsl.l, 0, 1);
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0,
            g = 0,
            b = 0;
        if (h < 60) [r, g] = [c, x];
        else if (h < 120) [r, g] = [x, c];
        else if (h < 180) [g, b] = [c, x];
        else if (h < 240) [g, b] = [x, c];
        else if (h < 300) [r, b] = [x, c];
        else [r, b] = [c, x];
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
            a: $Number.clamp(hsl.a, 0, 1),
        };
    }

    public static convertHslToHsv(hsl: HSL): HSV {
        return $Color.convertRgbToHsv($Color.convertHslToRgb(hsl));
    }

    public static convertHsvToHsl(hsv: HSV): HSL {
        return $Color.convertRgbToHsl($Color.convertHsvToRgb(hsv));
    }

    public static convertHexToHsv(hex: string): HSV {
        return $Color.convertRgbToHsv($Color.convertHexToRgb(hex));
    }

    public static convertHslToHex(hsl: HSL, type?: '#'): string;
    public static convertHslToHex(hsl: HSL, type?: '0x'): number;
    public static convertHslToHex(hsl: HSL, type: '#' | '0x' = '#'): string | number {
        return $Color.convertRgbToHex($Color.convertHslToRgb(hsl), <'#'>type);
    }

    public static convertHexToHsl(hex: string): HSL {
        return $Color.convertRgbToHsl($Color.convertHexToRgb(hex));
    }

    public static convertHsvToRgb(hsv: HSV): RGB {
        const h = ((hsv.h % 360) + 360) % 360;
        const s = $Number.clamp(hsv.s, 0, 1),
            v = $Number.clamp(hsv.v, 0, 1);
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r = 0,
            g = 0,
            b = 0;
        if (h < 60) [r, g] = [c, x];
        else if (h < 120) [r, g] = [x, c];
        else if (h < 180) [g, b] = [c, x];
        else if (h < 240) [g, b] = [x, c];
        else if (h < 300) [r, b] = [x, c];
        else [r, b] = [c, x];
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
            a: $Number.clamp(hsv.a, 0, 1),
        };
    }

    public static convertHsvToHex(hsv: HSV, type?: '#'): string;
    public static convertHsvToHex(hsv: HSV, type?: '0x'): number;
    public static convertHsvToHex(hsv: HSV, type: '#' | '0x' = '#'): string | number {
        return $Color.convertRgbToHex($Color.convertHsvToRgb(hsv), <'#'>type);
    }

    public static convertRgbToHex(rgb: RGB, type?: '#'): string;
    public static convertRgbToHex(rgb: RGB, type?: '0x'): number;
    public static convertRgbToHex(rgb: RGB, type: '#' | '0x' = '#'): string | number {
        const convert = (x) => {
            const hex = Number(x).toString(16);
            return hex.length < 2 ? '0' + hex : hex;
        };
        const hex = `#${convert(rgb.r)}${convert(rgb.g)}${convert(rgb.b)}${Math.round(rgb.a * 255).toString(16)}`;
        return type === '#' ? hex : $Color.convertHexToHex0(hex);
    }

    public static convertRgbToHsv(rgb: RGB): HSV {
        const r = rgb.r / 255,
            g = rgb.g / 255,
            b = rgb.b / 255;
        const max = Math.max(r, g, b),
            min = Math.min(r, g, b),
            d = max - min;
        const s = max === 0 ? 0 : d / max;
        let h = 0;
        if (d) {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                default:
                    h = (r - g) / d + 4;
            }
            h *= 60;
        }
        return { h: Math.round(h), s, v: max, a: rgb.a };
    }

    public static convertHexToName(hex: string): string {
        return Object.entries(Colors).find(([, color]) => hex.toLowerCase().startsWith(color))?.[0];
    }

    public static convertNameToHex(name: string, type?: '#'): string;
    public static convertNameToHex(name: string, type?: '0x'): number;
    public static convertNameToHex(name: string, type: '#' | '0x' = '#'): string | number {
        const color = $Enum.getItems(Colors).find((item) => item.key.toLowerCase() === name.toLowerCase());
        return type === '#' ? (color?.value as string) : $Color.convertHexToHex0(color?.value as string);
    }

    public static getFormat(color: string | number): ColorFormats {
        if (color === null || color === undefined) return null;
        if (typeof color === 'number' || (typeof color === 'string' && color.startsWith('0x'))) return ColorFormats.Hex0;
        if (typeof color === 'string') {
            if (color.startsWith('#')) return ColorFormats.Hex;
            if (color.startsWith('hsv')) return ColorFormats.HSV;
            if (color.startsWith('rgb')) return ColorFormats.RGB;
            if (color.startsWith('hsl')) return ColorFormats.HSL;
            return ColorFormats.Name;
        }
        return null;
    }

    public static parse(color: string | number): ColorData {
        if (!color) {
            return $Color.from();
        } else if (typeof color === 'number' || color.startsWith('0x')) {
            return $Color.from(color);
        } else if (color.startsWith('#')) {
            return $Color.from(color);
        } else if (color.startsWith('rgba')) {
            const matches = /rgba?\(((25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*?){2}(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,?\s*([01]\.?\d*?)?\)/.exec(color);
            return $Color.from({
                r: Number(matches[1]),
                g: Number(matches[2]),
                b: Number(matches[3]),
                a: Number(matches[4]),
            });
        } else if (color.startsWith('rgb')) {
            const matches = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.exec(color);
            return $Color.from({
                r: Number(matches[1]),
                g: Number(matches[2]),
                b: Number(matches[3]),
                a: 1,
            });
        } else if (color.startsWith('hsla')) {
            const matches = /^hsla\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d*(?:\.\d+)?)\)$/.exec(color);
            return $Color.from({
                h: Number(matches[1]),
                s: Number(matches[2]),
                l: Number(matches[3]),
                a: Number(matches[4]),
            });
        } else if (color.startsWith('hsl')) {
            const matches = /hsl\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.exec(color);
            return $Color.from({
                h: Number(matches[1]),
                s: Number(matches[2]),
                l: Number(matches[3]),
                a: 1,
            });
        } else if (color.startsWith('hsva')) {
            const matches = /^hsva\((\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d*(?:\.\d+)?)\)$/.exec(color);
            return $Color.from({
                h: Number(matches[1]),
                s: Number(matches[2]),
                v: Number(matches[3]),
                a: Number(matches[4]),
            });
        } else if (color.startsWith('hsv')) {
            const matches = /hsv\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.exec(color);
            return $Color.from({
                h: Number(matches[1]),
                s: Number(matches[2]),
                v: Number(matches[3]),
                a: 1,
            });
        } else {
            return $Color.from($Color.convertNameToHex(color));
        }
    }
}
