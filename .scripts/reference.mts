import { readFile, writeFile } from 'fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'path';

const docs = resolve('docs');
const output = join(docs, 'reference.md');
const visited = new Set<string>();
const stack = [join(docs, 'index.md')];
const sections: string[] = [];

while (stack.length) {
    const path = stack.pop()!;
    if (visited.has(path)) continue;
    visited.add(path);
    const content = (await readFile(path, 'utf8')).replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '').trim();
    sections.push(`<!-- ${relative(docs, path).split(sep).join('/')} -->\n\n${content}`);
    const links: string[] = [];
    if (basename(path) === 'index.md') for (const [, href] of content.matchAll(/\]\(([^)\s#?:]+\.md)(?:[#?][^)\s]*)?\)/g)) {
        const link = resolve(dirname(path), href);
        if (link !== output && link.startsWith(docs + sep) && !visited.has(link)) links.push(link);
    }
    stack.push(...links.reverse());
}

await writeFile(output, `${sections.join('\n\n')}\n`);
console.log(`Wrote ${sections.length} pages to ${relative(process.cwd(), output)}`);
