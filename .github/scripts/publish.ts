import { execSync } from 'child_process';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function exec(cmd: string): string {
    return execSync(cmd, { encoding: 'utf8' }).trim();
}

const currentVersion: string = JSON.parse(readFileSync('package.json', 'utf8')).version;

let previousVersion: string | null;
try {
    previousVersion = JSON.parse(exec(`git show HEAD~1:package.json`)).version;
} catch {
    previousVersion = null;
}

if (previousVersion !== null && currentVersion === previousVersion) {
    console.log(`Version unchanged (v${currentVersion}). Nothing to publish.`);
    process.exit(0);
}

console.log(previousVersion === null ? `First publish: v${currentVersion}` : `Version bump: ${previousVersion} -> ${currentVersion}`);

const packageDirectories = readdirSync(join(process.cwd(), 'packages', 'vorplex'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(directory => directory.name);

for (const packageDirectory of packageDirectories) {
    console.log(`Publishing @vorplex/${packageDirectory}...`);
    writeFileSync(join('packages', 'vorplex', packageDirectory, '.npmignore'), '');
    exec(`pnpm publish --filter "./packages/vorplex/${packageDirectory}" --access public --no-git-checks`);
}

console.log(`\nDone. Published ${packageDirectories.length} package(s) at v${currentVersion}.`);
