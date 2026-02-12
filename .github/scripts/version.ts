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
    const $package = JSON.parse(readFileSync(file, 'utf8'));
    const currentVersion = $package.version;
    $package.version = version;
    writeFileSync(file, JSON.stringify($package, null, 4) + '\n');
    console.log(`${$package.name} ${currentVersion} -> ${version}`);
}

console.log(`\nDone. Updated ${files.length} package(s) to v${version}.`);