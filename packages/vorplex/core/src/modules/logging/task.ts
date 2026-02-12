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

export class Task extends Subscribable<Task> {

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
        this.subscribe(task => task.parent?.emit(this.parent));
    }

    public async do<T>(name: string, callback: (task: Task) => Promise<T> | T): Promise<T> {
        const task = new Task(name, this);
        this.tasks.push(task);
        this.emit(this);
        try {
            const result = await callback(task);
            task.complete();
            return result;
        } catch (error) {
            task.fail();
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
        this.logs.push({
            timestamp: Date.now(),
            message,
            level: options?.level ?? 'info',
            attachments: options?.attachments ?? {}
        });
        this.emit(this);
    }

    public fail(error?: string | Error) {
        if (this.status !== 'failed') {
            if (error) this.log(error instanceof Error ? error.stack ?? error.message : error, { level: 'error' });
            this.status = 'failed';
            this.finishTimestamp = Date.now();
            this.emit(this);
        }
    }

    public complete() {
        if (this.status === 'busy') {
            this.status = 'done';
            this.finishTimestamp = Date.now();
            this.emit(this);
        }
    }

    public getStatus(): TaskStatus {
        let failed: boolean;
        for (const task of this.tasks) {
            const status = task.getStatus();
            if (status === 'failed') failed = true;
            if (status === 'busy') return 'busy';
        }
        if (failed) return 'failed';
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
                const status = { done: `${Chalk.White}★ [Done]`, busy: `${Chalk.Orange}★ [Busy]`, failed: `${Chalk.Red}★ [Failed]` }[task.getStatus()];
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
