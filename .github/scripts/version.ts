import { execFileSync } from 'child_process';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const version = process.argv[2];

if (!version) {
    console.error('Missing required parameter. Usage: version <version>');
    process.exit(1);
}

const files = [
    'package.json',
    ...readdirSync(join(process.cwd(), 'packages', 'vorplex'), { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => join('packages', 'vorplex', d.name, 'package.json'))
];

for (const file of files) {
    const gitPath = file.split('\\').join('/');

    const $package = JSON.parse(readFileSync(file, 'utf8'));
    const currentVersion = $package.version;
    $package.version = version;
    writeFileSync(file, JSON.stringify($package, null, 4) + '\n');
    const indexedPackage = JSON.parse(execFileSync('git', ['show', `:${gitPath}`], { encoding: 'utf8' }));
    indexedPackage.version = version;
    const sha = execFileSync('git', ['hash-object', '-w', '--stdin'], { input: JSON.stringify(indexedPackage, null, 4) + '\n', encoding: 'utf8' }).trim();
    execFileSync('git', ['update-index', '--cacheinfo', `100644,${sha},${gitPath}`]);
    console.log(`${$package.name} ${currentVersion} -> ${version}`);
}

console.log(`\nDone. Updated and staged ${files.length} package(s) to v${version}.`);