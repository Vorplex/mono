import { execSync } from 'child_process';
import { readFileSync, appendFileSync } from 'fs';

const current = JSON.parse(readFileSync('package.json', 'utf8')).version;

let previous;
try {
    previous = JSON.parse(execSync('git show HEAD~1:package.json', { encoding: 'utf8' })).version;
} catch {
    previous = null;
}

const changed = current !== previous;

appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
console.log(changed
    ? `Version changed: ${previous ?? '(none)'} -> ${current}`
    : `Version unchanged: ${current}`
);
