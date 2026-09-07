import { $String } from '@vorplex/core';

const MAX_EXPRESSION_LENGTH = 25;
const EXPRESSION_PLACEHOLDER = 'ƒ';

// A "simple reference" is an identifier followed by any number of .prop / ['key'] / [0] accesses and an
// optional trailing no-arg call -- e.g. `post.author.profile.displayName` or `items[0]['name']` or `count()`.
// Each regex matches one piece of that grammar at a fixed position (sticky `y` flag), so parsing is just
// repeated matching forward through the string, never backtracking over the whole expression.
const ROOT = /\s*([A-Za-z_$][\w$]*)/y;
const ACCESS = /\s*(?:\.\s*([A-Za-z_$][\w$]*)|\[\s*("(?:\\[^\n\r\u2028\u2029]|[^"\\\n\r\u2028\u2029])*"|'(?:\\[^\n\r\u2028\u2029]|[^'\\\n\r\u2028\u2029])*'|\d+)\s*\])/y;
const CALL = /\s*\(\s*\)/y;
const TRAILING_WHITESPACE = /\s*$/y;

interface ParsedReference {
    readonly normalized: string;
    readonly accesses: readonly string[];
    readonly call: '' | '()';
}

function matchAt(pattern: RegExp, value: string, index: number): RegExpExecArray | null {
    pattern.lastIndex = index;
    return pattern.exec(value);
}

// Examples:
//   "user.name"        -> { normalized: "user.name", accesses: [".name"], call: "" }
//   "items[0]['name']" -> { normalized: "items[0]['name']", accesses: ["[0]", "['name']"], call: "" }
//   "count()"          -> { normalized: "count()", accesses: [], call: "()" }
//   " name() "         -> { normalized: "name()", accesses: [], call: "()" }   (surrounding whitespace is stripped)
//   "a + b"            -> null                                                 (not a simple reference -- has an operator)
//   "items[i]"         -> null                                                 (dynamic bracket access, not a static key)
function parseSimpleReference(expression: string): ParsedReference | null {
    const root = matchAt(ROOT, expression, 0);
    if (!root) return null;
    let index = root[0].length;
    const accesses: string[] = [];
    while (true) {
        const access = matchAt(ACCESS, expression, index);
        if (!access) break;
        accesses.push(access[1] ? `.${access[1]}` : `[${access[2]}]`);
        index += access[0].length;
    }
    const callMatch = matchAt(CALL, expression, index);
    const call = callMatch ? '()' : '';
    if (callMatch) index += callMatch[0].length;
    if (!matchAt(TRAILING_WHITESPACE, expression, index)) return null;
    return { normalized: `${root[1]}${accesses.join('')}${call}`, accesses, call };
}

function isComplexExpression(reference: ParsedReference | null): reference is null {
    return reference === null;
}

function isLongExpression(reference: ParsedReference): boolean {
    return reference.normalized.length > MAX_EXPRESSION_LENGTH;
}

function trimExpression(reference: ParsedReference): string {
    for (let index = 0; index <= reference.accesses.length; index++) {
        const tail = reference.accesses.slice(index).join('').replace(/^\./, '') + reference.call;
        const candidate = `...${tail}`;
        if (candidate.length <= MAX_EXPRESSION_LENGTH) return `{{${candidate}}}`;
    }
    return EXPRESSION_PLACEHOLDER;
}

function formatExpression(expression: string): string {
    const reference = parseSimpleReference(expression);
    if (isComplexExpression(reference)) return EXPRESSION_PLACEHOLDER;
    if (isLongExpression(reference)) return trimExpression(reference);
    // return reference.normalized;
    return `{${reference.normalized}}`;
}

export const ExpressionDisplay = {
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
