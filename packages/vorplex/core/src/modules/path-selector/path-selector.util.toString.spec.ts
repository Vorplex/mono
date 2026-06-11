import { $PathSelector } from './path-selector.util';

describe($PathSelector.toString.name, () => {
    it('should join simple segments with a dot', () => {
        expect($PathSelector.toString(['foo', 'bar', 'baz'])).toBe('foo.bar.baz');
    });

    it('should escape dots in segments', () => {
        expect($PathSelector.toString(['foo.bar', 'baz'])).toBe('foo\\.bar.baz');
    });

    it('should escape backslashes in segments', () => {
        expect($PathSelector.toString(['foo\\bar', 'baz'])).toBe('foo\\\\bar.baz');
    });

    it('should escape opening brackets in segments', () => {
        expect($PathSelector.toString(['foo[0]', 'bar'])).toBe('foo\\[0\\].bar');
    });

    it('should escape closing brackets in segments', () => {
        expect($PathSelector.toString('a]b')).toBe('a\\]b');
    });

    it('should handle a single segment without modification', () => {
        expect($PathSelector.toString('simple')).toBe('simple');
    });

    it('should return empty string for a single empty segment', () => {
        expect($PathSelector.toString('')).toBe('');
    });

    it('should handle multiple special characters in one segment', () => {
        expect($PathSelector.toString(['a.b[c]\\d'])).toBe('a\\.b\\[c\\]\\\\d');
    });

    it('should produce output parseable back to original segments', () => {
        const segments = ['foo.bar', 'baz[0]', 'qux\\quux'];
        const sanitized = $PathSelector.toString(segments);
        const parsed = $PathSelector.parse(sanitized);
        expect(parsed).toEqual(segments);
    });
});
