import ts from 'typescript';

export class $ScriptAnalyzer {

    public static getDefaultExportPublicMethodNames(code: string): string[] {
        const sourceFile = ts.createSourceFile(
            'script.ts',
            code,
            ts.ScriptTarget.Latest,
            true
        );

        const methods: string[] = [];
        ts.forEachChild(sourceFile, node => {
            if (ts.isClassDeclaration(node)) {
                const modifiers = ts.getModifiers(node);
                const hasExport = modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
                const hasDefault = modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);

                if (hasExport && hasDefault) {
                    for (const member of node.members) {
                        if (ts.isMethodDeclaration(member) && member.name) {
                            const modifiers = member.modifiers ?? [];
                            if (modifiers.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword || modifier.kind === ts.SyntaxKind.PrivateKeyword)) return;
                            const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText(sourceFile);
                            methods.push(name);
                        }
                    }
                }
            }
        });
        return methods;
    }
}
