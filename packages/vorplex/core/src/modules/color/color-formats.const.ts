export const ColorFormats = {
    RGB: 'RGB',
    HSL: 'HSL',
    HSV: 'HSV',
    Hex: 'Hex',
    Hex0: 'Hex0',
    Name: 'Name',
} as const;
export type ColorFormats = (typeof ColorFormats)[keyof typeof ColorFormats];
