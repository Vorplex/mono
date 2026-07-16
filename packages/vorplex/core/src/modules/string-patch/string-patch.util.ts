import { $Array } from '../array/array.util';

export type StringHunk = readonly [start: number, end: number, insert: string];
export type StringChange = StringHunk | readonly StringHunk[];

export class $StringPatch {

    private static readonly maxCharsToDiff = 1000;
    private static readonly maxLinesToDiff = 2000;

    public static isHunk(value: any): value is StringHunk {
        return Array.isArray(value)
            && value.length === 3
            && Number.isInteger(value[0]) && value[0] >= 0
            && Number.isInteger(value[1]) && value[1] >= value[0]
            && typeof value[2] === 'string';
    }

    public static isChange(value: any): value is StringChange {
        if ($StringPatch.isHunk(value)) return true;
        return Array.isArray(value) && value.length > 0 && value.every((hunk: any) => $StringPatch.isHunk(hunk));
    }

    public static diff(base: string, target: string): StringChange | string {
        if (base === target) return target;
        let best: StringChange = $StringPatch.getSingleHunk(base, target);
        let tokenize: ((text: string) => string[]) | undefined;
        if (base.length <= $StringPatch.maxCharsToDiff && target.length <= $StringPatch.maxCharsToDiff) {
            tokenize = (text) => [...text];
        } else if ((base.includes('\n') || target.includes('\n'))
            && $StringPatch.countLines(base) <= $StringPatch.maxLinesToDiff
            && $StringPatch.countLines(target) <= $StringPatch.maxLinesToDiff) {
            tokenize = (text) => text.split(/(?<=\n)/);
        }
        if (tokenize) {
            const hunks = $StringPatch.getHunks(base, target, tokenize);
            const multi: StringChange = hunks.length === 1 ? hunks[0] : hunks;
            if (JSON.stringify(multi).length < JSON.stringify(best).length) best = multi;
        }
        return JSON.stringify(best).length < JSON.stringify(target).length ? best : target;
    }

    public static apply(base: string, change: StringChange | string): string {
        if (typeof change === 'string') return change;
        const hunks: readonly StringHunk[] = $StringPatch.isHunk(change) ? [change] : change;
        let result = '';
        let cursor = 0;
        for (const [start, end, insert] of hunks) {
            if (start < cursor || end > base.length) throw new Error('String change out of bounds');
            result += base.slice(cursor, start) + insert;
            cursor = end;
        }
        return result + base.slice(cursor);
    }

    private static countLines(text: string): number {
        let count = 1;
        for (let i = 0; i < text.length; i++) if (text[i] === '\n') count++;
        return count;
    }

    private static getHunks(base: string, target: string, tokenize: (text: string) => string[]): StringHunk[] {
        const baseTokens = tokenize(base);
        const operations = $Array.diff(baseTokens, tokenize(target));
        const raw: StringHunk[] = [];
        let cursor = 0;
        let hunkStart = -1;
        let insert = '';
        for (const operation of operations) {
            if (operation.type === 'keep') {
                if (hunkStart !== -1) {
                    raw.push([hunkStart, cursor, insert]);
                    hunkStart = -1;
                    insert = '';
                }
                cursor += baseTokens[operation.sourceIndex].length;
            } else if (operation.type === 'delete') {
                if (hunkStart === -1) hunkStart = cursor;
                cursor += baseTokens[operation.sourceIndex].length;
            } else {
                if (hunkStart === -1) hunkStart = cursor;
                insert += operation.value;
            }
        }
        if (hunkStart !== -1) raw.push([hunkStart, cursor, insert]);
        const hunks: StringHunk[] = [];
        for (const hunk of raw) {
            const previous = hunks[hunks.length - 1];
            if (previous) {
                const combined: StringHunk = [previous[0], hunk[1], previous[2] + base.slice(previous[1], hunk[0]) + hunk[2]];
                if (JSON.stringify(combined).length <= JSON.stringify(previous).length + JSON.stringify(hunk).length + 1) {
                    hunks[hunks.length - 1] = combined;
                    continue;
                }
            }
            hunks.push(hunk);
        }
        return hunks;
    }

    private static getSingleHunk(base: string, target: string): StringHunk {
        const baseTokens = [...base];
        const targetTokens = [...target];
        const maxPrefix = Math.min(baseTokens.length, targetTokens.length);
        let prefix = 0;
        let prefixOffset = 0;
        while (prefix < maxPrefix && baseTokens[prefix] === targetTokens[prefix]) {
            prefixOffset += baseTokens[prefix].length;
            prefix++;
        }
        const maxSuffix = maxPrefix - prefix;
        let suffix = 0;
        let suffixOffset = 0;
        while (suffix < maxSuffix && baseTokens[baseTokens.length - 1 - suffix] === targetTokens[targetTokens.length - 1 - suffix]) {
            suffixOffset += baseTokens[baseTokens.length - 1 - suffix].length;
            suffix++;
        }
        const insert = targetTokens.slice(prefix, targetTokens.length - suffix).join('');
        return [prefixOffset, base.length - suffixOffset, insert];
    }

}
