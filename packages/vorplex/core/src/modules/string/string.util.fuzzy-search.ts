import { $PathSelector, SelectorPath } from '../path-selector/path-selector.util';

export type FuzzySearchResult<T> = { item: T; score: number; matches: number[][] };
type Character = { value: string; start: number; end: number; boundary: boolean };

export function fuzzySearch<T>(items: T[], paths: SelectorPath<T>[], search: string): FuzzySearchResult<T>[] {
    const query = prepare(search).map(c => c.value).join('').trim();
    if (!query) return items.map(item => ({
        item, score: 0, matches: Array.from({ length: paths.length || 1 }, () => []),
    }));
    const words = [...new Set(query.split(' '))].map(word => [...word]);
    const phrase = words.map(word => word.join('')).join(' ');
    const selectors = paths.length ? paths.map(path => $PathSelector.parse(path)) : [[]];

    return items.flatMap<FuzzySearchResult<T>>(item => {
        const values = selectors.map(path => [$PathSelector.query(item, path)].flat(Infinity)
            .filter(value => ['string', 'number', 'bigint', 'boolean'].includes(typeof value)).map(String));
        const characters = prepare(values.flat().join(' '));
        const offsets = new Set<number>();
        let score = 0;
        for (const word of words) {
            const match = matchWord(characters, word);
            if (!match) return [];
            score += match.score;
            for (const index of match.indexes) {
                const { start, end } = characters[index];
                for (let offset = start; offset < end; offset++) offsets.add(offset);
            }
        }
        let offset = 0;
        const matches = values.map(parts => {
            const text = parts.join(' ');
            const indexes: number[] = [];
            for (let index = 0; index < text.length; index++) {
                if (offsets.has(offset + index)) indexes.push(index);
            }
            offset += parts.length ? text.length + 1 : 0;
            return indexes;
        });
        const exact = characters.map(c => c.value).join('') === phrase;
        return [{ item, score: exact ? 0 : 0.5 + score / words.length, matches }];
    }).sort((a, b) => a.score - b.score);
}

function prepare(text: string): Character[] {
    const characters: Character[] = [];
    let previous = '';
    for (const part of text.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
        const raw = part[0], start = part.index!, end = start + raw.length;
        let boundary = !previous || !/[\p{L}\p{N}]/u.test(previous)
            || (/\p{Ll}/u.test(previous) && /\p{Lu}/u.test(raw))
            || (/\p{Lu}/u.test(previous) && /\p{Lu}/u.test(raw) && /^\p{Ll}/u.test(text.slice(end)));
        for (const character of raw.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '')) {
            const value = /\s/u.test(character) ? ' ' : character;
            const last = characters[characters.length - 1];
            if (value === ' ' && last?.value === ' ') last.end = end;
            else characters.push({ value, start, end, boundary });
            boundary = false;
        }
        previous = raw;
    }
    return characters;
}

function matchWord(text: Character[], word: string[]): { score: number; indexes: number[] } | null {
    if (word.every((value, index) => text[index]?.value === value)) {
        return { score: 0, indexes: word.map((_, index) => index) };
    }
    let matched = 0;
    for (const { value } of text) {
        if (value === word[matched]) matched++;
        if (matched === word.length) break;
    }
    if (matched !== word.length) return null;

    const unit = text.length + 1;
    const parents: Int32Array[] = [];
    let costs = text.map(({ value, boundary }, index) => value === word[0]
        ? (index === 0 ? 0 : boundary ? 1 : 2) * unit + index : Infinity);
    for (const letter of word.slice(1)) {
        const parent = new Int32Array(text.length);
        let best = -1;
        costs = text.map(({ value, boundary }, index) => {
            const before = index - 2;
            if (before >= 0 && (best < 0 || costs[before] - before < costs[best] - best)) best = before;
            if (value !== letter) return Infinity;
            const adjacent = costs[index - 1] ?? Infinity;
            const gapped = best < 0 ? Infinity : costs[best] + index - best - 1 + (boundary ? 3 : 4) * unit;
            parent[index] = adjacent <= gapped ? index - 1 : best;
            return Math.min(adjacent, gapped);
        });
        parents.push(parent);
    }
    let end = 0;
    for (let index = 1; index < text.length; index++) {
        if (costs[index] < costs[end]) end = index;
    }
    const score = costs[end] / unit;
    const indexes = [end];
    for (const parent of parents.reverse()) {
        end = parent[end];
        indexes.push(end);
    }
    return { score, indexes: indexes.reverse() };
}
