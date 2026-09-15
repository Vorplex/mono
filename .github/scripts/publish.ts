import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

function exec(cmd: string): string {
    return execSync(cmd, { encoding: 'utf8' }).trim();
}

const currentVersion: string = JSON.parse(readFileSync('package.json', 'utf8')).version;

console.log(`Publishing v${currentVersion}...`);

const packageDirectories = readdirSync(join(process.cwd(), 'packages', 'vorplex'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(directory => directory.name)
    .filter(directory => {
        const packagePath = join(process.cwd(), 'packages', 'vorplex', directory, 'package.json');
        const $package = JSON.parse(readFileSync(packagePath, 'utf8'));
        if ($package.private) console.log(`Skipping ${$package.name} (private)`);
        return !$package.private;
    });

for (const packageDirectory of packageDirectories) {
    console.log(`Publishing @vorplex/${packageDirectory}...`);
    exec(`cd "./packages/vorplex/${packageDirectory}" && pnpm publish --access public --no-git-checks`);
}

console.log(`\nDone. Published ${packageDirectories.length} package(s) at v${currentVersion}.`);
