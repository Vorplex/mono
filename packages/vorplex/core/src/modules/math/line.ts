import { $Point, type Point } from './point';

export interface Line {
    start: Point;
    end: Point;
}

export class Line {
    public static contains(line: Line, point: Point) {
        const { x: x1, y: y1 } = line.start;
        const { x: x2, y: y2 } = line.end;
        const { x, y } = point;

        // Check if the point is within the bounding box of the line segment
        const withinBoundingBox = x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2);

        if (!withinBoundingBox) {
            return false;
        }

        // Check if the point satisfies the line equation
        const slope = (y2 - y1) / (x2 - x1);
        const equation = y - y1 === slope * (x - x1);

        return equation;
    }

    public static getMiddle(line: Line): Point {
        return {
            x: (line.start.x + line.end.x) / 2,
            y: (line.start.y + line.end.y) / 2,
        };
    }

    public static getIntersect(a: Line, b: Line) {
        const { x: x1, y: y1 } = a.start;
        const { x: x2, y: y2 } = a.end;
        const { x: x3, y: y3 } = b.start;
        const { x: x4, y: y4 } = b.end;

        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) {
            return null; // Lines are parallel or coincident
        }

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            // Intersection point lies within both line segments
            const x = x1 + ua * (x2 - x1);
            const y = y1 + ua * (y2 - y1);
            return $Point.create(x, y);
        } else {
            return null; // Intersection point is outside the line segments
        }
    }

    public static equals(a: Line, b: Line) {
        return $Point.equals(a.start, b.start) && $Point.equals(a.end, b.end);
    }

    public static toString(line: Line) {
        return `${line.start.toString()}${line.end.toString()}`;
    }
}
