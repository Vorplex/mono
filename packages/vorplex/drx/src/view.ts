import { Scope, Signal } from '@vorplex/core';

export class DrxView {

    private scope?: Scope;
    private disposed = false;

    constructor(public readonly node: ChildNode, private readonly activate: () => void = () => { }) { }

    public mount(parent: Node, before: Node | null = null): void {
        if (this.disposed) throw new Error('Cannot mount a disposed view');
        parent.insertBefore(this.node, before);
        if (this.scope) return;
        try {
            this.scope = Signal.scope(this.activate);
        } catch (error) {
            this.node.remove();
            this.disposed = true;
            throw error;
        }
    }

    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        try {
            this.scope?.dispose();
        } finally {
            this.node.remove();
        }
    }

}
