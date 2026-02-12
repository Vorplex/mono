import { parsePath, parsePathSelector } from './parse-path-selector.function';

describe(parsePath.name, () => {
    it('should return array segments of path', () => {
        const path = 'item.child.items[0].name.custom property.toString.[1][\'A1\']["A2"][`A3`]';
        const selectorPath = parsePath(path);
        const segments = ['item', 'child', 'items', '0', 'name', 'custom property', 'toString', '1', 'A1', 'A2', 'A3'];
        expect(selectorPath).toEqual(segments);
    });
});

describe(parsePathSelector.name, () => {
    it('should return array segments of path', () => {
        const selectorPath = parsePathSelector<any>(state => state.item.child.items[0].name['custom property'].toString[1]['A1']["A2"][`A3`]);
        const segments = ['item', 'child', 'items', '0', 'name', 'custom property', 'toString', '1', 'A1', 'A2', 'A3'];
        expect(selectorPath).toEqual(segments);
    });
});

