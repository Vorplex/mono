export class $String {

    public static indent(string: string, spaces: number) {
        return string?.replace(/^/gm, ' '.repeat(spaces));
    }

    public static toAlphanumeric(string: string, specialCharacterReplacement?: string): string {
        return string.replace(/[^a-zA-Z0-9]/g, specialCharacterReplacement ?? '');
    }

    public static indexesOf(string: string, pattern: string): number[] {
        const indexes = [];
        let index = string.indexOf(pattern);
        while (index > -1) {
            indexes.push(index);
            index = string.indexOf(pattern, index + 1);
        }
        return indexes;
    }

    public static upperCaseFirst(string: string) {
        return string.slice(0, 1).toUpperCase() + string.slice(1);
    }

    public static getWords(string: string): string[] {
        const regex = new RegExp(['[A-Z][a-z]+', '[A-Z]+(?=[A-Z][a-z])', '[A-Z]+', '[a-z]+', '[0-9]+'].join('|'), 'g');
        return string.match(regex) ?? [];
    }

    public static camelCase(string: string) {
        return $String
            .getWords(string)
            .map((word, index) => (index === 0 ? word.toLowerCase() : $String.upperCaseFirst(word.toLowerCase())))
            .join('');
    }

    public static kebabCase(string: string) {
        return $String
            .getWords(string)
            .map((word) => word.toLowerCase())
            .join('-');
    }

    public static titleCase(string: string): string {
        return $String
            .getWords(string.replace(/[-_]/g, ' '))
            .map(word => $String.upperCaseFirst(word.toLowerCase()))
            .join(' ');
    }

    public static isNullOrEmpty(value: string) {
        return value == null || value === '';
    }

    public static sanitizeForRegex(string: string) {
        return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    public static matchDelimited(text: string, [open, close]: readonly [string, string]): { type: 'text' | 'match'; value: string }[] {
        if (!open || !close) throw new Error('Delimiters cannot be empty');
        const tokens: { type: 'text' | 'match'; value: string }[] = [];
        const characterMode = (() => {
            if (open.length !== close.length) return;
            const pairs = new Map<string, string>();
            const closingCharacters = new Set<string>();
            for (let index = 0; index < open.length; index++) {
                const openingCharacter = open[index];
                const closingCharacter = close[close.length - index - 1];
                const existing = pairs.get(openingCharacter);
                if (openingCharacter === closingCharacter || (existing !== undefined && existing !== closingCharacter)) return;
                pairs.set(openingCharacter, closingCharacter);
                closingCharacters.add(closingCharacter);
            }
            if ([...pairs.keys()].some(character => closingCharacters.has(character))) return;
            return { pairs, closingCharacters };
        })();
        let cursor = 0;
        while (cursor < text.length) {
            const opening = text.indexOf(open, cursor);
            if (opening === -1) break;
            if (opening > cursor) {
                tokens.push({
                    type: 'text',
                    value: text.slice(cursor, opening),
                });
            }
            const start = opening + open.length;
            const stack = characterMode
                ? Array.from(open, (_, index) => close[close.length - index - 1])
                : undefined;
            let index = start;
            let depth = 1;
            let closingIndex: number | undefined;
            while (index < text.length) {
                const character = text[index];
                if (characterMode && stack) {
                    const nestedCloser = characterMode.pairs.get(character);
                    if (nestedCloser !== undefined) {
                        stack.push(nestedCloser);
                    } else if (character === stack.at(-1)) {
                        stack.pop();
                        if (stack.length === 0) {
                            const candidate = index - close.length + 1;
                            if (candidate >= start && text.startsWith(close, candidate)) closingIndex = candidate;
                            break;
                        }
                    } else if (characterMode.closingCharacters.has(character)) {
                        break;
                    }
                    index++;
                    continue;
                }
                if (text.startsWith(open, index)) {
                    depth++;
                    index += open.length;
                } else if (text.startsWith(close, index)) {
                    if (--depth === 0) {
                        closingIndex = index;
                        break;
                    }
                    index += close.length;
                } else {
                    index++;
                }
            }
            if (closingIndex === undefined) throw new Error(`Missing closing delimiter "${close}"`);
            tokens.push({
                type: 'match',
                value: text.slice(start, closingIndex),
            });
            cursor = closingIndex + close.length;
        }
        if (cursor < text.length) {
            tokens.push({
                type: 'text',
                value: text.slice(cursor),
            });
        }
        return tokens;
    }

}
