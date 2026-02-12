import type { HSL } from './hsl.interface';
import type { HSV } from './hsv.interface';
import type { RGB } from './rgb.interface';

export type Color = RGB | HSL | HSV | string | number;
