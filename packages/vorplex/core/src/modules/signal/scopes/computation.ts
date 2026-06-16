import { Signal } from '../signal';
import { Scope } from './scope';

export class ComputationScope extends Scope {

    private readonly dependencies = new Set<Signal>();

    public override run(): void {
        if (this.disposed) return;
        this.cleanup();
        super.run();
    }

    public override cleanup(): void {
        super.cleanup();
        for (const dependency of this.dependencies) {
            dependency.subscribers.delete(this);
        }
        this.dependencies.clear();
    }

    public registerDependency(dependency: Signal) {
        this.dependencies.add(dependency);
    }

}
