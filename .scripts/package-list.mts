import { $FileSystem } from '@vorplex/node';
import { join } from 'path';
import { parse, stringify } from 'yaml';

const root = process.cwd();
const workspaceYaml = await $FileSystem.readFileText(join(root, 'pnpm-workspace.yaml'));
const workspace = parse(workspaceYaml!);
const overrides: Record<string, string> = workspace.overrides ?? {};

const packageJsons = await $FileSystem.getEntries(join(root, 'packages'), {
    type: 'file',
    recursive: {
        depth: 2
    },
    regex: /package\.json/
});
packageJsons.push({ type: 'file', path: join(root, 'package.json') });

const packages: { name: string, dependencies: Record<string, string> }[] = [];

for (const packageJson of packageJsons) {
    const parsedPackage = await $FileSystem.readFileJson(packageJson.path);
    packages.push({ name: parsedPackage.name, dependencies: { ...parsedPackage.dependencies, ...parsedPackage.devDependencies, ...parsedPackage.peerDependencies } });
}

const result: Record<string, string[]> = {};

for (const override in overrides) {
    result[override] = packages.filter($package => $package.dependencies[override]).map($package => $package.name);
}

console.log(stringify(result));
