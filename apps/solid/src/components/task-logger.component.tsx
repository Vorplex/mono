import { $Array, $Date, $Number, Log, Task, TaskStatus, Unit } from '@vorplex/core';
import { createStyle, useInjector, useSubscription } from '@vorplex/solid';
import { classNames } from '@vorplex/web';
import { createMemo, createSignal, For, Match, Show, Switch } from 'solid-js';
import { Theme } from '../consts/theme';
import { ModalService } from '../services/modal.service';
import { Icon } from './icon.component';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
    },
    taskContent: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
        paddingLeft: '10px',
        marginLeft: '17px',
        borderLeft: `1px solid ${Theme().outline.primary}`,
    },
    item: {
        display: 'flex',
        gap: '5px',
        padding: '5px 10px',
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        background: Theme().secondary.color,
        color: Theme().secondary.text
    },
    task: {
        '&:hover': {
            cursor: 'pointer',
            boxShadow: Theme().hoverShadow,
        }
    }
}));

const LogMessageComponentClasses = createStyle(() => ({
    container: {
        display: 'flex',
        gap: '2px'
    },
    attachment: {
        textDecoration: 'underline',
        '&:hover': {
            cursor: 'pointer',
            color: Theme().info.outline
        }
    },
    embedding: {
        display: 'inline-grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'max-content',
        gap: '5px',
        padding: '0px 5px',
        borderRadius: '5px',
        overflow: 'hidden',
        background: Theme().input.color,
        color: Theme().input.text
    }
}));
function LogMessageComponent(props: { log: Log }) {

    const services = useInjector({
        modal: ModalService
    });

    const message = createMemo(() => {
        const { message, attachments } = props.log;
        const getParts = () => {
            const parts: { type: 'text' | 'attachment', value: string }[] = [];
            const regex = /\$\[([^\]]*)\]/g;
            let match: RegExpExecArray | null;
            let lastIndex = 0;
            while ((match = regex.exec(message)) !== null) {
                if (match.index > lastIndex) parts.push({ type: 'text', value: message.slice(lastIndex, match.index) });
                parts.push({ type: 'attachment', value: match[1] });
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < message.length) parts.push({ type: 'text', value: message.slice(lastIndex) });
            return parts;
        };
        return getParts().map(part => {
            switch (part.type) {
                case 'text': return part.value;
                case 'attachment': return (
                    <span
                        class={LogMessageComponentClasses().attachment}
                        onClick={() => {
                            const attachment = attachments[part.value];
                            let content = attachment.value;
                            services.modal.showMonaco({
                                readonly: true,
                                language: ({ typescript: 'typescript', yaml: 'yaml', text: 'yaml', json: 'yaml' } as const)[attachment.type],
                                title: part.value,
                                value: content
                            });
                        }}
                        innerText={part.value} />
                );
            }
        });
    });

    return (
        <pre>
            <For each={message()}>
                {(part) => part}
            </For>
        </pre>
    );
}



export function TaskLoggerComponent(props: { task: Task }) {

    function LogItemComponent(props: { log: Log }) {

        return (
            <div class={classes().item}>
                <span />
                <Icon name={'message-square-more'} />
                <span style={{ color: Theme().background.subText }} innerText={$Date.format(new Date(props.log.timestamp), 'DD/MM/YY hh:mm:ss')} />
                <span style={{ color: props.log.level === 'warning' ? Theme().warning.outline : props.log.level === 'error' ? Theme().error.outline : 'unset', 'flex-grow': 1 }}>
                    <LogMessageComponent log={props.log} />
                </span>
            </div>
        );
    }

    function TaskComponent(props: { task: Task }) {

        const event = useSubscription(props.task, { type: 'action', task: props.task, action: props.task, source: props.task });
        const [expanded, setExpanded] = createSignal<boolean>();
        const status = createMemo(() => event().task.getStatus());
        const warning = createMemo(() => event().task.hasWarning());
        const shouldExpand = createMemo(() => !props.task.parent || status() !== TaskStatus.Complete && expanded() !== false || expanded());

        const items = createMemo(() => {
            return $Array.orderBy([
                ...event().task.logs.map(log => ({ type: 'log' as const, value: log })),
                ...event().task.tasks.map(task => ({ type: 'task' as const, value: task }))
            ], item => item.type === 'log' ? item.value.timestamp : item.value.startTimestamp);
        });

        return (
            <>
                <div class={classNames(classes().item, classes().task)} onClick={() => setExpanded(!shouldExpand())}>
                    <Icon name={shouldExpand() ? 'chevron-down' : 'chevron-right'} style={{ color: Theme().outline.primary }} />
                    <Icon
                        style={{
                            color: status() === TaskStatus.Busy ? Theme().info.outline : status() === TaskStatus.Failed || status() === TaskStatus.Cancelled ? Theme().error.outline : warning() ? Theme().warning.outline : Theme().success.outline
                        }}
                        name={status() === TaskStatus.Busy ? 'loader-circle' : status() === TaskStatus.Complete ? 'circle-check' : 'circle-x'}
                        spin={status() === TaskStatus.Busy}
                    />
                    <span style={{ color: Theme().background.subText }} innerText={$Date.format(new Date(event().task.startTimestamp), 'DD/MM/YY hh:mm:ss')} />
                    <span style={{ color: status() === TaskStatus.Busy ? Theme().info.outline : status() === TaskStatus.Failed ? Theme().error.outline : 'unset', 'flex-grow': 1 }} innerText={event().task.name} />
                    <Show when={event().task.finishTimestamp - event().task.startTimestamp > 0}>
                        <span style={{ color: Theme().background.subText }} innerText={$Number.toUnitString(event().task.finishTimestamp - event().task.startTimestamp, Unit.Time)} />
                    </Show>
                    <div>
                        <Icon name={'message-square-more'} />
                        <span innerText={event().task.logs.length} />
                    </div>
                    <div>
                        <Icon name={'list-check'} />
                        <span innerText={event().task.tasks.length} />
                    </div>
                </div>
                <Show when={shouldExpand()}>
                    <div class={classes().taskContent}>
                        <For each={items()}>
                            {item => (
                                <Switch>
                                    <Match when={item.type === 'log'}>
                                        <LogItemComponent log={item.value as Log} />
                                    </Match>
                                    <Match when={item.type === 'task'}>
                                        <TaskComponent task={item.value as Task} />
                                    </Match>
                                </Switch>
                            )}
                        </For>
                    </div>
                </Show>
            </>
        );
    }

    return (
        <div class={classes().container}>
            <TaskComponent task={props.task} />
        </div>
    );
}
