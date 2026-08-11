import { $String } from '@vorplex/core';

const MAX_EXPRESSION_LENGTH = 25;
const EXPRESSION_PLACEHOLDER = '{{...}}';

export interface SimpleReference {
    readonly normalized: string;
    readonly accesses: readonly string[];
}

function isIdentifierStart(character: string | undefined): boolean {
    return Boolean(character && /[A-Za-z_$]/.test(character));
}

function isIdentifierPart(character: string | undefined): boolean {
    return Boolean(character && /[A-Za-z0-9_$]/.test(character));
}

function skipWhitespace(value: string, start: number): number {
    let index = start;
    while (index < value.length && /\s/.test(value[index])) index++;
    return index;
}

function readIdentifier(value: string, start: number): { value: string; end: number } | null {
    if (!isIdentifierStart(value[start])) return null;
    let end = start + 1;
    while (isIdentifierPart(value[end])) end++;
    return { value: value.slice(start, end), end };
}

function readStaticBracket(value: string, start: number): { value: string; end: number } | null {
    let index = skipWhitespace(value, start + 1);
    const quote = value[index];
    if (quote === '\'' || quote === '"') {
        const contentStart = index;
        index++;
        let closed = false;
        while (index < value.length) {
            const character = value[index++];
            if (character === '\n' || character === '\r' || character === '\u2028' || character === '\u2029') return null;
            if (character === '\\') {
                if (index >= value.length || /[\n\r\u2028\u2029]/.test(value[index])) return null;
                index++;
            } else if (character === quote) {
                closed = true;
                break;
            }
        }
        if (!closed) return null;
        const key = value.slice(contentStart, index);
        index = skipWhitespace(value, index);
        if (value[index] !== ']') return null;
        return { value: `[${key}]`, end: index + 1 };
    }

    const numberStart = index;
    while (/[0-9]/.test(value[index] ?? '')) index++;
    if (index === numberStart) return null;
    const key = value.slice(numberStart, index);
    index = skipWhitespace(value, index);
    if (value[index] !== ']') return null;
    return { value: `[${key}]`, end: index + 1 };
}

function parseSimpleReference(expression: string): SimpleReference | null {
    let index = skipWhitespace(expression, 0);
    const root = readIdentifier(expression, index);
    if (!root) return null;
    index = root.end;
    const accesses: string[] = [];

    while (true) {
        index = skipWhitespace(expression, index);
        if (expression[index] === '.') {
            index = skipWhitespace(expression, index + 1);
            const property = readIdentifier(expression, index);
            if (!property) return null;
            accesses.push(`.${property.value}`);
            index = property.end;
            continue;
        }
        if (expression[index] === '[') {
            const bracket = readStaticBracket(expression, index);
            if (!bracket) return null;
            accesses.push(bracket.value);
            index = bracket.end;
            continue;
        }
        break;
    }

    index = skipWhitespace(expression, index);
    let call = '';
    if (expression[index] === '(') {
        index = skipWhitespace(expression, index + 1);
        if (expression[index] !== ')') return null;
        call = '()';
        index++;
    }
    if (skipWhitespace(expression, index) !== expression.length) return null;
    return { normalized: `${root.value}${accesses.join('')}${call}`, accesses };
}

function abbreviateReference(reference: SimpleReference): string {
    let abbreviation = '';
    for (let index = reference.accesses.length - 1; index >= 0; index--) {
        const tail = reference.accesses.slice(index).join('').replace(/^\./, '');
        const candidate = `...${tail}`;
        if (candidate.length > MAX_EXPRESSION_LENGTH) break;
        abbreviation = candidate;
    }
    return abbreviation ? `{{${abbreviation}}}` : EXPRESSION_PLACEHOLDER;
}

function formatExpression(expression: string): string {
    const reference = parseSimpleReference(expression);
    if (!reference) return EXPRESSION_PLACEHOLDER;
    if (reference.normalized.length <= MAX_EXPRESSION_LENGTH) return `{{${reference.normalized}}}`;
    return abbreviateReference(reference);
}

export const ExpressionDisplay = {
    // Recognizes "is this expression just a variable-path reference" (an identifier root followed by
    // .prop / [static 'key'] / [123] accesses and an optional trailing no-arg call) without evaluating it.
    // Returns null for anything else (operators, multiple calls, computed brackets, ...). Shared by mask()
    // below and by consumers that need to validate or decompose a simple reference, e.g. a binding builder.
    parseReference: parseSimpleReference,
    // Masks every {{ }} expression in a source string down to a short, non-evaluated preview -- this never
    // runs the expression, it only reformats its literal source text. Uses $String.matchDelimited (not a
    // regex split) so nested braces inside an expression, e.g. {{ { name: '' } }}, are matched as one segment
    // instead of breaking early on the first inner '}'.
    //
    // Examples:
    //   "{{user.name}}"                       -> "{{user.name}}"                 (short simple reference, shown in full)
    //   "{{post.author.profile.displayName}}" -> "{{...profile.displayName}}"    (simple reference, too long -- abbreviated from the tail)
    //   "{{items[0].label}}"                  -> "{{items[0].label}}"            (static bracket access is still a simple reference)
    //   "{{count()}}"                         -> "{{count()}}"                   (trailing no-arg call on a simple reference is kept)
    //   "{{a + b}}"                           -> "{{...}}"                       (not a simple reference -- generic placeholder)
    //   "{{condition ? 'x' : 'y'}}"           -> "{{...}}"                       (not a simple reference -- generic placeholder)
    //   "{{ { name: user.name } }}"           -> "{{...}}"                       (nested braces -- matched as one segment, not a simple reference)
    //   "Hello {{user.name}}!"                -> "Hello {{user.name}}!"          (surrounding literal text is untouched)
    mask(content: string): string {
        return $String.matchDelimited(content, ['{{', '}}'])
            .map(segment => segment.type === 'text' ? segment.value : formatExpression(segment.value))
            .join('');
    }
};
