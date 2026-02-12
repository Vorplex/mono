import { $Value } from '../value/value.util';
import { Line } from './line';
import { $Point, type Point } from './point';

export type PolygonIntersection = {
    polygonA: Polygon;
    polygonB: Polygon;
    edgeIndexA: number;
    edgeIndexB: number;
    edgeA: Line;
    edgeB: Line;
    point: Point;
};

export class Polygon {
    public readonly vertices: Point[];

    constructor(vertices: Point[]) {
        this.vertices = vertices;
    }

    public static getEdge(polygon: Polygon, index: number): Line {
        if (index < 0) index += polygon.vertices.length;
        return {
            start: polygon.vertices[index],
            end: polygon.vertices[index + 1] ?? polygon.vertices[0],
        };
    }

    public getEdge(index: number): Line {
        return Polygon.getEdge(this, index);
    }

    public static getEdges(polygon: Polygon): Line[] {
        return polygon.vertices.map((vertex, index) => ({
            start: vertex,
            end: polygon.vertices[index === polygon.vertices.length - 1 ? 0 : index + 1],
        }));
    }

    public getEdges(): Line[] {
        return Polygon.getEdges(this);
    }

    public static containsPoint(polygon: Polygon, point: Point): boolean {
        const { x, y } = point;
        let inside = false;

        for (let i = 0, j = polygon.vertices.length - 1; i < polygon.vertices.length; j = i++) {
            const xi = polygon.vertices[i].x,
                yi = polygon.vertices[i].y;
            const xj = polygon.vertices[j].x,
                yj = polygon.vertices[j].y;

            const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }

        return inside;
    }

    public containsPoint(point: Point) {
        return Polygon.containsPoint(this, point);
    }

    public static move(polygon: Polygon, position: Point): Polygon {
        const vertices = polygon.vertices.map((vertex) => $Point.plus(vertex, position));
        return new Polygon(vertices);
    }

    public move(position: Point): Polygon {
        return Polygon.move(this, position);
    }

    public static getIntersections(a: Polygon, b: Polygon, unique?: boolean) {
        const intersections: {
            intersections: PolygonIntersection[];
            edges: Record<string, PolygonIntersection[]>;
            points: Record<string, PolygonIntersection>;
        } = {
            intersections: [],
            edges: {},
            points: {},
        };
        for (let vertexIndexA = 0; vertexIndexA < a.vertices.length; vertexIndexA++) {
            const edgeA = a.getEdge(vertexIndexA);
            const startWithinB = b.containsPoint(edgeA.start);
            const endWithinB = b.containsPoint(edgeA.end);
            if (!startWithinB || !endWithinB) {
                for (let vertexIndexB = 0; vertexIndexB < b.vertices.length; vertexIndexB++) {
                    const edgeB = b.getEdge(vertexIndexB);
                    const intersectionPoint = Line.getIntersect(edgeA, edgeB);
                    if (intersectionPoint) {
                        if (unique && intersections.points[intersectionPoint.toString()]) continue;
                        const intersection: PolygonIntersection = {
                            polygonA: a,
                            polygonB: b,
                            edgeA,
                            edgeB,
                            edgeIndexA: vertexIndexA,
                            edgeIndexB: vertexIndexB,
                            point: intersectionPoint,
                        };
                        intersections.intersections.push(intersection);
                        intersections.edges[edgeA.toString()] = (intersections.edges[edgeA.toString()] ?? []).concat(intersection);
                        intersections.edges[edgeB.toString()] = (intersections.edges[edgeB.toString()] ?? []).concat(intersection);
                        intersections.points[intersectionPoint.toString()] = intersection;
                    }
                }
            }
        }
        return intersections;
    }

    public getIntersections(polygon: Polygon, unique?: boolean) {
        return Polygon.getIntersections(this, polygon, unique);
    }

    public static getLineIntersections(polygon: Polygon, line: Line) {
        const intersections: {
            edgeIndex: number;
            edge: Line;
            point: Point;
        }[] = [];
        for (let vertexIndex = 0; vertexIndex < polygon.vertices.length; vertexIndex++) {
            const edge = Polygon.getEdge(polygon, vertexIndex);
            const point = Line.getIntersect(edge, line);
            if (point) intersections.push({ edgeIndex: vertexIndex, edge, point });
        }
        return intersections;
    }

    public getLineIntersections(polygon: Polygon, line: Line) {
        return Polygon.getLineIntersections(polygon, line);
    }

    public static subtract(a: Polygon, b: Polygon): Polygon[] {
        const polygons: Polygon[] = [];
        const intersections = Polygon.getIntersections(a, b, true);
        const visitedIntersections: Record<string, PolygonIntersection> = {};

        const trailA = (vertex?: number | PolygonIntersection, vertices: Point[] = []): Point[] => {
            if (typeof vertex === 'number' && vertex < 0) vertex = a.vertices.length - 1;
            if (vertex == null) {
                if (Polygon.containsPoint(b, a.vertices[0])) {
                    return trailA(0, vertices);
                } else {
                    vertices.push(a.vertices[0]);
                    vertices.push(...trailA(0, vertices));
                }
            } else {
                const edgeIndex = typeof vertex === 'object' ? vertex.edgeIndexA : vertex;
                const edge = Polygon.getEdge(a, edgeIndex);
                if (typeof vertex === 'object') {
                    if ($Point.equals(vertex.point, edge.start)) {
                        visitedIntersections[$Point.toString(vertex.point)] = intersections.points[$Point.toString(vertex.point)];
                        return vertices;
                    }
                    const directionalLine: Line = {
                        start: vertex.point,
                        end: edge.end,
                    };
                    const intersection = intersections.edges[edge.toString()]
                        ?.filter((intersection) => intersection.point !== vertex.point && Line.contains(directionalLine, intersection.point))
                        .sort((a, b) => $Point.distance(edge.start, a.point) - $Point.distance(edge.start, b.point))[0];
                    if (intersection) {
                        visitedIntersections[$Point.toString(intersection.point)] = intersection;
                        vertices.push(intersection.point);
                        vertices.push(...trailB(intersection, vertices));
                    } else {
                        if ($Point.equals(vertices[0], edge.end)) return vertices;
                        vertices.push(edge.end);
                        vertices.push(...trailA(vertex.edgeIndexA + 1, vertices));
                    }
                } else {
                    const intersection = (
                        vertices.length ? intersections.edges[edge.toString()] : intersections.edges[edge.toString()]?.filter((intersection) => !$Point.equals(intersection.point, edge.start))
                    )?.sort((a, b) => $Point.distance(edge.start, a.point) - $Point.distance(edge.start, b.point))[0];
                    if (intersection) {
                        if (!$Point.equals(intersection.edgeB.start, intersection.point) && !$Point.equals(intersection.edgeB.end, intersection.point))
                            visitedIntersections[$Point.toString(intersection.point)] = intersection;
                        if ($Point.equals(vertices[0], intersection.point)) return vertices;
                        vertices.push(intersection.point);
                        if (vertices.length > 1) {
                            vertices.push(...trailB(intersection, vertices));
                        } else {
                            vertices.push(...trailA(intersection, vertices));
                        }
                    } else if (Polygon.containsPoint(b, edge.end)) {
                        return trailA(vertex + 1, vertices);
                    } else {
                        if ($Point.equals(vertices[0], edge.end)) return vertices;
                        vertices.push(edge.end);
                        return trailA(vertex + 1, vertices);
                    }
                }
            }
            return vertices;
        };

        const trailB = (vertex: number | PolygonIntersection, vertices: Point[] = [], trailDirectionFactor?: 1 | -1): Point[] => {
            if (typeof vertex === 'number' && vertex < 0) vertex = b.vertices.length - 1;
            const edgeIndex = typeof vertex === 'object' ? vertex.edgeIndexB : vertex;
            const edge = b.getEdge(edgeIndex);
            if (typeof vertex === 'object') {
                let directionFactor: 1 | -1;
                if (Polygon.containsPoint(a, edge.start)) {
                    directionFactor = -1;
                } else if (Polygon.containsPoint(a, edge.end)) {
                    directionFactor = 1;
                } else {
                    const intersection = intersections.edges[edge.toString()]
                        ?.filter(
                            (intersection) =>
                                intersection.point !== vertex.point &&
                                Polygon.containsPoint(
                                    a,
                                    Line.getMiddle({
                                        start: vertex.point,
                                        end: intersection.point,
                                    }),
                                ),
                        )
                        .sort((a, b) => $Point.distance(edge.start, a.point) - $Point.distance(edge.start, b.point))[0];
                    visitedIntersections[$Point.toString(intersection.point)] = intersection;
                    if ($Point.equals(vertices[0], intersection.point)) return vertices;
                    vertices.push(intersection.point);
                    vertices.push(...trailA(intersection, vertices));
                    return vertices;
                }
                const targetVertex = directionFactor === 1 ? edge.end : edge.start;
                const directionalLine: Line = {
                    start: vertex.point,
                    end: targetVertex,
                };
                const intersection = intersections.edges[edge.toString()]
                    ?.filter((intersection) => intersection.point !== vertex.point && Line.contains(directionalLine, intersection.point))
                    .sort((a, b) => $Point.distance(trailDirectionFactor === 1 ? edge.end : edge.start, a.point) - $Point.distance(trailDirectionFactor === 1 ? edge.end : edge.start, b.point))[0];
                if (intersection) {
                    visitedIntersections[$Point.toString(intersection.point)] = intersection;
                    if ($Point.equals(vertices[0], intersection.point)) return vertices;
                    vertices.push(intersection.point);
                    vertices.push(...trailA(intersection, vertices));
                } else {
                    if ($Point.equals(vertices[0], targetVertex)) return vertices;
                    vertices.push(targetVertex);
                    vertices.push(...trailB(vertex.edgeIndexB + directionFactor, vertices, directionFactor));
                }
            } else {
                const intersection = intersections.edges[edge.toString()]?.sort(
                    (a, b) => $Point.distance(trailDirectionFactor === 1 ? edge.end : edge.start, a.point) - $Point.distance(trailDirectionFactor === 1 ? edge.end : edge.start, b.point),
                )[0];
                if (intersection) {
                    visitedIntersections[$Point.toString(intersection.point)] = intersection;
                    if ($Point.equals(vertices[0], intersection.point)) return vertices;
                    vertices.push(intersection.point);
                    vertices.push(...trailA(intersection, vertices));
                } else if (Polygon.containsPoint(a, trailDirectionFactor === 1 ? edge.end : edge.start)) {
                    if ($Point.equals(vertices[0], trailDirectionFactor === 1 ? edge.end : edge.start)) return vertices;
                    vertices.push(trailDirectionFactor === 1 ? edge.end : edge.start);
                    return trailB(vertex + trailDirectionFactor, vertices, trailDirectionFactor);
                } else {
                    if ($Point.equals(vertices[0], trailDirectionFactor === 1 ? edge.start : edge.end)) return vertices;
                    vertices.push(trailDirectionFactor === 1 ? edge.end : edge.start);
                    return trailB(vertex + trailDirectionFactor, vertices, trailDirectionFactor);
                }
            }
            return vertices;
        };

        console.group('Start');
        while (Object.keys(visitedIntersections).length !== intersections.intersections.length) {
            let vertices: Point[];
            if (Object.keys(visitedIntersections).length === 0) vertices = trailA();
            else {
                const intersection = intersections.intersections.find((intersection) => !visitedIntersections[$Point.toString(intersection.point)]);
                console.log({
                    intersection,
                    visitedIntersections: $Value.clone(visitedIntersections),
                    intersections,
                    visitedIntersectionsCount: Object.keys(visitedIntersections).length,
                    intersectionsCount: intersections.intersections.length,
                });
                vertices = trailA(intersection, [intersection.point]);
                visitedIntersections[$Point.toString(intersection.point)] = intersection;
            }
            polygons.push(new Polygon(vertices));
        }
        console.groupEnd();

        return polygons;
    }

    public subtract(polygon: Polygon) {
        return Polygon.subtract(this, polygon);
    }
}
