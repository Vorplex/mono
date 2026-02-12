import { Predicate } from '@vorplex/core';

export interface IDragOptions<T> {
    event: DragEvent;
    type: string;
    data: T;
    onDragStop?: () => void;
}

export class Drag {

    private static listener: {
        target: EventTarget;
        drop: (event: DragEvent) => void;
        over: (event: DragEvent) => void;
        leave: (event: DragEvent) => void;
        dispose?: () => void;
    };

    public static options: IDragOptions<any>;
    private static targetElement: EventTarget;

    public static start<T>(options: IDragOptions<T>) {
        Drag.options = options;
        Drag.targetElement = options.event.currentTarget;
        options.event.currentTarget.addEventListener('dragend', () => {
            options.onDragStop?.();
            this.cleanup();
        }, { once: true });
    }

    public static get<T = any>(): { options: IDragOptions<T>, draggedElement: HTMLElement, acceptedElement: HTMLElement } {
        return {
            options: this.options,
            draggedElement: this.targetElement as HTMLElement,
            acceptedElement: this.listener?.target as HTMLElement
        };
    }

    public static accepts<T>(options: { event: DragEvent; type: string; condition?: (data: T, event: DragEvent) => boolean; accepting?: (event: DragEvent, data: T) => () => void; dropped: (data: T) => void }): boolean {
        if (!this.options) return false;
        if (options.event.currentTarget === this.targetElement) return false;
        if (Drag.options?.type !== options.type) return false;
        if (options.condition && !options.condition(Drag.options.data, options.event)) return;
        const target = options.event.currentTarget as EventTarget;
        if (this.listener?.target === target) return false;
        this.cleanupTarget();
        let acceptingDispose: () => void;
        this.listener = {
            target,
            drop: (e: DragEvent) => {
                e.preventDefault();
                options.dropped(this.options.data);
                this.cleanup();
            },
            over: (event: DragEvent) => {
                if (!this.options) return;
                if (event.currentTarget === this.targetElement) return;
                event.preventDefault();
                acceptingDispose = options.accepting?.(event, Drag.options.data);
            },
            leave: (e: DragEvent) => {
                const relatedTarget = e.relatedTarget as Node | null;
                if (e.currentTarget === target && (target instanceof Node && (!relatedTarget || !target.contains(relatedTarget)))) {
                    this.cleanupTarget();
                }
            },
            dispose: () => {
                acceptingDispose?.();
            }
        };
        target.addEventListener('drop', this.listener.drop, { once: true });
        target.addEventListener('dragover', this.listener.over);
        target.addEventListener('dragleave', this.listener.leave);
        return true;
    }

    private static cleanupTarget() {
        this.listener?.target.removeEventListener('dragover', this.listener.over);
        this.listener?.target.removeEventListener('drop', this.listener.drop);
        this.listener?.target.removeEventListener('dragleave', this.listener.leave);
        this.listener?.dispose?.();
        this.listener = null;
    }

    private static cleanup() {
        this.cleanupTarget();
        this.options = null;
        this.targetElement = null;
    }

}
