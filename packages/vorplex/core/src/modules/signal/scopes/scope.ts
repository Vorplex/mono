export class Scope {

    public static current: Scope | null = null;

    private cleanups: (() => void)[] = [];
    public readonly children = new Set<Scope>();
    public readonly depth: number;
    public disposed = false;

    constructor(public readonly func: () => void, public readonly parent: Scope | null) {
        this.depth = parent ? parent.depth + 1 : 0;
        parent?.children.add(this);
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.cleanup();
        this.parent?.children.delete(this);
    }

    public registerCleanup(cleanup: () => void): void {
        this.cleanups.push(cleanup);
    }

    public run(): void {
        const previousScope = Scope.current;
        Scope.current = this;
        try {
            this.func();
        } finally {
            Scope.current = previousScope;
        }
    }

    public cleanup(): void {
        for (const child of [...this.children]) {
            child.dispose();
        }
        this.children.clear();
        for (const cleanup of this.cleanups) {
            cleanup();
        }
        this.cleanups = [];
    }
}
