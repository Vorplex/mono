import { Unit } from '../../consts/unit.const';
import { $Array } from '../array/array.util';
import { $Date } from '../date/date.util';
import { $Number } from '../number/number.util';
import { $String } from '../string/string.util';
import { Subscribable } from '../subscribable/subscribable.model';
import { Chalk } from './console-logger.model';

export const TaskStatus = {
    Busy: 'busy',
    Failed: 'failed',
    Done: 'done',
    Cancelled: 'cancelled'
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export interface Attachment {
    type: 'json' | 'yaml' | 'text' | 'typescript';
    value: string;
}
export interface Log {
    timestamp: number;
    message: string;
    level: 'info' | 'warning' | 'error';
    attachments: Record<string, Attachment>
}

export interface TaskEventBase {
    type: 'cancel' | 'action' | 'log' | 'fail' | 'complete';
    source: Task;
    task: Task;
};

export interface CancelTaskEvent extends TaskEventBase {
    type: 'cancel';
};

export interface ActionTaskEvent extends TaskEventBase {
    type: 'action';
    action: Task;
};

export interface LogTaskEvent extends TaskEventBase {
    type: 'log';
    log: Log;
};

export interface FailTaskEvent extends TaskEventBase {
    type: 'fail';
    reason: string | Error;
};

export interface CompleteTaskEvent extends TaskEventBase {
    type: 'complete';
};

export type TaskEvent = CancelTaskEvent | ActionTaskEvent | LogTaskEvent | FailTaskEvent | CompleteTaskEvent;

export class Task extends Subscribable<TaskEvent> {

    public startTimestamp: number = Date.now();
    public finishTimestamp: number;
    public status: TaskStatus = TaskStatus.Busy;
    public name: string;
    public parent?: Task;
    public tasks: Task[] = [];
    public logs: Log[] = [];

    constructor(name: string, task?: Task) {
        super();
        this.name = name;
        this.parent = task;
        this.subscribe(event => this.parent?.emit({ ...event, task: this }));
    }

    public isCancelled() {
        return this.status === TaskStatus.Cancelled || this.parent?.isCancelled() === true;
    }

    public cancel() {
        if (this.status === TaskStatus.Busy) {
            this.log('Task cancelled', { level: 'error' });
            this.status = TaskStatus.Cancelled;
            this.finishTimestamp = Date.now();
            this.emit({ source: this, type: 'cancel', task: this });
        }
    }

    public async do<T>(name: string, callback: (task: Task) => Promise<T> | T): Promise<T> {
        if (this.isCancelled()) throw new Error('Task cancelled');
        const task = new Task(name, this);
        this.tasks.push(task);
        this.emit({ source: this, type: 'action', task: this, action: task });
        try {
            const result = await callback(task);
            task.complete();
            return result;
        } catch (error) {
            task.fail(error);
            throw error;
        }
    }

    public static async do<T>(name: string, callback: (task: Task) => Promise<T> | T): Promise<T> {
        const task = new Task(name);
        try {
            return await callback(task);
        } catch (error) {
            task.fail(error);
            throw error;
        } finally {
            task.complete();
        }
    }

    public log(message: string, options?: { level?: 'info' | 'warning' | 'error', attachments?: Record<string, Attachment> }) {
        if (this.isCancelled()) throw new Error('Task cancelled');
        const log: Log = {
            timestamp: Date.now(),
            message,
            level: options?.level ?? 'info',
            attachments: options?.attachments ?? {}
        };
        this.logs.push(log);
        this.emit({ source: this, type: 'log', task: this, log });
    }

    public fail(reason?: string | Error) {
        if (this.status === TaskStatus.Busy) {
            if (reason) this.log(reason instanceof Error ? reason.stack ?? reason.message : reason, { level: 'error' });
            this.status = TaskStatus.Failed;
            this.finishTimestamp = Date.now();
            this.emit({ source: this, type: 'fail', task: this, reason: reason });
        }
    }

    public complete() {
        if (this.status === TaskStatus.Busy) {
            this.status = TaskStatus.Done;
            this.finishTimestamp = Date.now();
            this.emit({ source: this, type: 'complete', task: this });
        }
    }

    public getStatus(): TaskStatus {
        if (this.status === TaskStatus.Failed) return TaskStatus.Failed;
        if (this.status === TaskStatus.Cancelled) return TaskStatus.Cancelled;
        for (const task of this.tasks) {
            const status = task.getStatus();
            if (status === TaskStatus.Failed) return TaskStatus.Failed;
            if (status === TaskStatus.Busy) return TaskStatus.Busy;
        }
        if (this.isCancelled()) return TaskStatus.Cancelled;
        return this.status;
    }

    public hasWarning(): boolean {
        for (const log of this.logs) {
            if (log.level === 'warning') return true;
        }
        for (const task of this.tasks) {
            const warning = task.hasWarning();
            if (warning) return true;
        }
        return false;
    }

    public toConsoleLog() {
        const formatter = {
            task: (task: Task) => {
                const status = { done: `${Chalk.White}★ [Done]`, busy: `${Chalk.Orange}★ [Busy]`, failed: `${Chalk.Red}★ [Failed]`, cancelled: `${Chalk.Red}★ [Cancelled]` }[task.getStatus()];
                const date = $Date.format(new Date(task.startTimestamp), '[YYYY-MM-DD hh:mm:ss]');
                const duration = $Number.toUnitString(task.finishTimestamp - task.startTimestamp, Unit.Time);
                return `${status} ${date} ${task.name} ${Chalk.Dim}${duration}${Chalk.Reset}`;
            },
            log: (log: Log) => {
                const color = { info: Chalk.DarkGray, warning: Chalk.Orange, error: Chalk.Red }[log.level];
                const level = { info: '●', warning: 'o', error: 'x' }[log.level];
                const date = $Date.format(new Date(log.timestamp), '[YYYY-MM-DD hh:mm:ss]');
                let message = $String.indent(log.message, 2).slice(2);
                let attachments = '';
                for (const [attachmentName, attachmentValue] of Object.entries(log.attachments)) {
                    message = message.replaceAll(`$[${attachmentName}]`, attachmentName);
                    attachments += `\n${attachmentName}: ${attachmentValue.value == null ? 'null' : attachmentValue.value === '' ? "" : attachmentValue.value}`;
                }
                return `${color}${level} ${date} ${message}${Chalk.Dim}${attachments ? $String.indent(attachments, 2) : ''}${Chalk.Reset}`;
            }
        };
        const items = $Array.orderBy([...this.logs.map(log => ({ type: 'log' as const, value: log })), ...this.tasks.map(task => ({ type: 'task' as const, value: task }))], item => item.type === 'task' ? item.value.startTimestamp : item.value.timestamp);
        let log = `${formatter.task(this)}\n`;
        for (const item of items) {
            const entry = item.type === 'task' ? item.value.toConsoleLog() : formatter.log(item.value);
            log += `${$String.indent(entry, 2)}\n`;
        }
        return log.trim();
    }
}
