import type { HSL } from './hsl.interface';
import type { HSV } from './hsv.interface';
import type { RGB } from './rgb.interface';

export interface ColorData {
    hex0: number;
    hex: string;
    rgb: RGB;
    hsl: HSL;
    hsv: HSV;
}
