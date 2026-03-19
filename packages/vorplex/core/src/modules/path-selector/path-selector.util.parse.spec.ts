import { $PathSelector } from './path-selector.util';

describe($PathSelector.parse.name, () => {
    it('should parse a simple dot-separated path', () => {
        expect($PathSelector.parse('foo.bar.baz')).toEqual(['foo', 'bar', 'baz']);
    });

    it('should parse bracket notation', () => {
        expect($PathSelector.parse('items[0]')).toEqual(['items', '0']);
    });

    it('should parse mixed dot and bracket notation', () => {
        expect($PathSelector.parse('foo.items[1].name')).toEqual(['foo', 'items', '1', 'name']);
    });

    it('should parse a single segment', () => {
        expect($PathSelector.parse('foo')).toEqual(['foo']);
    });

    it('should parse consecutive brackets', () => {
        expect($PathSelector.parse('a[0][1]')).toEqual(['a', '0', '1']);
    });

    it('should handle escaped dot in path', () => {
        expect($PathSelector.parse('foo\\.bar.baz')).toEqual(['foo.bar', 'baz']);
    });

    it('should handle escaped bracket in path', () => {
        expect($PathSelector.parse('foo\\[bar\\].baz')).toEqual(['foo[bar]', 'baz']);
    });

    it('should skip empty segments from leading dot', () => {
        expect($PathSelector.parse('.foo.bar')).toEqual(['foo', 'bar']);
    });

    it('should skip empty brackets', () => {
        expect($PathSelector.parse('foo[].bar')).toEqual(['foo', 'bar']);
    });

    it('should return empty array for empty string', () => {
        expect($PathSelector.parse('')).toEqual([]);
    });

    it('should parse via function selector', () => {
        type Example = { child: { name: string } };
        const result = $PathSelector.parse<Example>(example => example.child.name);
        expect(result).toEqual(['child', 'name']);
    });

    it('should parse function selector with array access', () => {
        type Example = { items: { name: string }[] };
        const result = $PathSelector.parse<Example>(example => example.items[0].name);
        expect(result).toEqual(['items', '0', 'name']);
    });

    it('should parse function selector returning single property', () => {
        type Example = { value: number };
        const result = $PathSelector.parse<Example>(example => example.value);
        expect(result).toEqual(['value']);
    });
});
