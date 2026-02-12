import { $Number } from '../number/number.util';
import { $Object } from '../object/object.util';
import type { Rect } from './rect';

export interface Point {
    x: number;
    y: number;
}

export class $Point {

    private static parse(...args: any[]): Point {
        return $Point.create(...(args as [] | [number] | [number, number] | [Partial<Point>]));
    }

    public static create(): Point;
    public static create(value: number): Point;
    public static create(x: number, y: number): Point;
    public static create(point: Partial<Point>): Point;
    public static create(...args: [] | [number] | [number, number] | [Partial<Point>]): Point;
    public static create(...args: [] | [number] | [number, number] | [Partial<Point>]): Point {
        let value: Point;
        if (args.length === 0) {
            value = { x: 0, y: 0 };
        } else if (args.length === 1) {
            if (typeof args[0] === 'number') {
                value = { x: args[0], y: args[0] };
            } else {
                value = $Object.getDefaults(args[0] as Point, { x: 0, y: 0 });
            }
        } else {
            value = { x: args[0], y: args[1] };
        }
        return { x: value.x, y: value.y };
    }

    public static plus(point: Point, value: number): Point;
    public static plus(point: Point, x: number, y: number): Point;
    public static plus(a: Point, b: Partial<Point>): Point;
    public static plus(...params: [Point, number] | [Point, number, number] | [Point, Partial<Point>]): Point {
        const value = $Point.parse(...params.slice(1));
        return {
            x: params[0].x + value.x, y: params[0].y + value.y
        };
    }

    public static minus(point: Point, value: number): Point;
    public static minus(point: Point, x: number, y: number): Point;
    public static minus(a: Point, b: Partial<Point>): Point;
    public static minus(...params: any[]): Point {
        const value = $Point.parse(...params.slice(1));
        return {
            x: params[0].x - value.x, y: params[0].y - value.y
        };
    }

    public static times(point: Point, value: number): Point;
    public static times(point: Point, x: number, y: number): Point;
    public static times(a: Point, b: Partial<Point>): Point;
    public static times(...params: any[]): Point {
        const value = $Point.parse(...params.slice(1));
        return { x: params[0].x * value.x, y: params[0].y * value.y };
    }

    public static divide(point: Point, value: number): Point;
    public static divide(point: Point, x: number, y: number): Point;
    public static divide(a: Point, b: Partial<Point>): Point;
    public static divide(...params: any[]): Point {
        const value = $Point.parse(...params.slice(1));
        return { x: params[0].x / value.x, y: params[0].y / value.y };
    }

    public static distance({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point = $Point.create()): number {
        const x = x1 - x2;
        const y = y1 - y2;
        return Math.sqrt(x * x + y * y);
    }

    public static isPointInCircle({ x, y, r }: Point & { r: number }, point: Point) {
        return $Point.distance($Point.parse(x, y), point) < r;
    }

    public static isPointInRect(point: Point, rect: Rect): boolean {
        return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
    }

    public static move(point: Point, length: number, radian: number = 0): Point {
        return $Point.create({
            x: point.x + length * Math.cos(radian),
            y: point.y + length * Math.sin(radian),
        });
    }

    public static equals(a: Point, b: Point) {
        return a === b || (a?.x === b?.x && a?.y === b?.y);
    }

    public static snap({ x, y }: Point, snap: number): Point {
        return { x: $Number.snap(x, snap), y: $Number.snap(y, snap) };
    }

    public static toString(value: Point) {
        return `(${value.x}, ${value.y})`;
    }
}
