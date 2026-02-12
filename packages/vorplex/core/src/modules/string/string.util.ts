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

    public static isNullOrEmpty(value: string) {
        return value == null || value === '';
    }

    public static sanitizeForRegex(string: string) {
        return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

}
