import { $Path } from './path.util';

describe($Path.glob.name, () => {
    function test(message: string, pattern: string, matches: string[], rejects: string[]) {
        it(message, () => {
            const regex = $Path.glob(pattern);
            for (const path of matches) expect(regex.test(path)).toBe(true);
            for (const path of rejects) expect(regex.test(path)).toBe(false);
        });
    }

    test('should match a file name in any folder when the pattern has no slash', '*.ts', ['a.ts', 'drx/app/script.ts'], ['a.tsx', 'a.css']);
    test('should match within one folder with a single star', 'drx/*.html', ['drx/index.html'], ['drx/app/app.html']);
    test('should match any depth with a double star', 'drx/**', ['drx/index.html', 'drx/app/pages/home/page.html'], ['src/index.html']);
    test('should match zero or more folders with a double star and slash', 'drx/**/page.html', ['drx/page.html', 'drx/app/pages/home/page.html'], ['drx/app/home.html']);
    test('should match a single character with a question mark', 'drx/a?.ts', ['drx/ab.ts'], ['drx/abc.ts', 'drx/a/.ts']);
    test('should treat regex characters literally', 'drx/a+b(1).ts', ['drx/a+b(1).ts'], ['drx/aab1.ts']);
});
