import { $Path, Task } from '@vorplex/core';
import { maxSatisfying, satisfies } from 'semver';
import { stringify } from 'yaml';
import type { PackageJson } from './package-json.type';

export type DependencyTree = Record<string, DependencyNode>;

export interface DependencyNode {
    version: string;
    dependencies: Record<string, DependencyNode>;
}

export class NPM {
    public static readonly url = 'https://registry.npmjs.org' as const;

    public static async getData(name: string) {
        const response = await fetch($Path.join(NPM.url, name));
        if (!response.ok) throw new Error(`Failed to get package (${name}) data. ${response.statusText}`);
        return await response.json();
    }

    public static async gePackageJson(name: string, version: string): Promise<PackageJson> {
        const response = await fetch($Path.join(NPM.url, name, version));
        if (!response.ok) throw new Error(`Failed to get package (${name}) data. ${response.statusText}`);
        return await response.json();
    }

    public static async resolveDependencyTree(packages: Record<string, string>, resolver: { getPackageJson: (name: string, version: string) => Promise<PackageJson>; getPackageVersions: (name: string) => Promise<string[]>; }, task: Task = new Task('Resolve Dependency Tree')): Promise<DependencyTree> {
        try {
            const seen: DependencyTree = {};

            async function resolvePackage(name: string, range: string, ancestors: any[] = [], task: Task): Promise<DependencyNode> {
                task.log(`Resolving package (${name}@${range})`);
                if (range === 'latest') range = '*';

                task.log(`Searching for package in ancestors`);
                for (const ancestor of ancestors) {
                    const existing = ancestor.dependencies?.[name];
                    if (existing && satisfies(existing.version, range, { includePrerelease: true })) {
                        task.log(`Existing package found. Deduping`);
                        return existing;
                    }
                }
                task.log(`No existing package found in ancestors`);

                task.log('Resolving package versions');
                const available = await resolver.getPackageVersions(name);
                const version = maxSatisfying(available, range, { includePrerelease: true });
                if (!version) {
                    throw new Error(`No version found for ${name}@${range}`);
                }
                task.log(`Version (${version}) was resolved for range (${range})`);

                const key = `${name}@${version}`;
                if (seen[key]) {
                    task.log(`Reusing globally deduped package`);
                    return seen[key];
                }

                task.log(`Resolving package.json`);
                const pkg = await resolver.getPackageJson(name, version);
                task.log(`$[package.json] resolved`, { attachments: { 'package.json': { type: 'yaml', value: stringify(pkg) } } });
                const node: DependencyNode = { version, dependencies: {} };
                seen[key] = node;

                if (pkg.dependencies) {
                    task.log('Resolving packages dependencies.');
                    await Promise.all(Object.entries(pkg.dependencies).map(async ([depName, depRange]) =>
                        await task.do(`${depName}@${depRange}`, async (task) => {
                            node.dependencies[depName] = await resolvePackage(depName, depRange, [node, ...ancestors], task);
                        })
                    ));
                    task.log('Done resolving packages dependencies.');
                }

                if (pkg.peerDependencies) {
                    task.log('Resolving packages peer-dependencies.');
                    await Promise.all(Object.entries(pkg.peerDependencies).map(async ([peerName, peerRange]) =>
                        await task.do(`${peerName}@${peerRange}`, async (task) => {
                            node.dependencies[peerName] = await resolvePackage(
                                peerName,
                                peerRange,
                                ancestors,
                                task
                            );
                        })
                    ));
                    task.log('Done resolving packages peer-dependencies.');
                }

                return node;
            }

            const tree: DependencyTree = {};
            task.log('Resolving packages');
            await Promise.all(Object.entries(packages).map(async ([name, range]) =>
                await task.do(`${name}@${range}`, async (task) => {
                    tree[name] = await resolvePackage(name, range, [], task);
                })
            ));
            task.log('Done resolving packages');

            task.log('Done resolving dependency tree');
            return tree;
        } catch (error) {
            task.fail(error);
            throw error;
        } finally {
            task.complete();
        }
    }

    public static flattenDependencyTree(tree: DependencyTree): Record<string, string[]> {
        function flatten(tree: DependencyTree, visited: Set<string> = new Set()): Record<string, string[]> {
            const flattened: Record<string, string[]> = {};
            for (const [name, data] of Object.entries(tree)) {
                const key = `${name}@${data.version}`;
                if (visited.has(key)) continue;
                visited.add(key);
                flattened[name] = [...(flattened[name] ?? []), data.version];
                if (data.dependencies) {
                    for (const [dependency, version] of Object.entries(flatten(data.dependencies, visited))) {
                        flattened[dependency] = [...(flattened[dependency] ?? []), ...version];
                    }
                }
            }
            return flattened;
        }
        return flatten(tree);
    }

    public static resolveDependencyVersion(tree: DependencyTree, parent: string, version: string, name: string): string {
        const resolve = (tree: DependencyTree) => {
            for (const [packName, pack] of Object.entries(tree)) {
                if (packName === parent && pack.version === version) return pack.dependencies[name]?.version;
                const dependency = resolve(pack.dependencies);
                if (dependency) return dependency;
            }
        };
        return resolve(tree);
    }

    public static getScriptImports(script: string): string[] {
        return Array.from(script.matchAll(/import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g)).map((match) => match[1] ?? match[2]);
    }

    public static parseImportString(string: string) {
        if (!string) throw new Error('Invalid import string');
        const match = string.match(/^(?<packageName>(?:@[\w-]+\/[\w-]+|[\w-]+))(?:\/(?<subpath>.+?))?(?:\/?@(?<version>\d+(?:\.\d+)*(?:-[\w.]+)?(?:\+[\w.]+)?))?$/);
        if (!match) throw new Error(`Invalid import string (${string})`);
        return match?.groups as {
            packageName: string;
            subpath?: string;
            version?: string;
        };
    }
}
