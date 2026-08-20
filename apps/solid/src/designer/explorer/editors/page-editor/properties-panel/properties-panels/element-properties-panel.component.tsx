import { $Tson, MapAdaptor } from '@vorplex/core';
import { createStyle, defineComponent, ForIn, useInjector, useStore } from '@vorplex/solid';
import { $Element } from '@vorplex/web';
import { createMemo, JSX } from 'solid-js';
import { ButtonComponent } from '../../../../../../components/button.component';
import { Icon } from '../../../../../../components/icon.component';
import { PanelComponent } from '../../../../../../components/panel.component';
import { Theme } from '../../../../../../consts/theme';
import { PlatformService } from '../../../../../../services/platform.service';
import { BindingInputComponent } from '../binding-value-editor.component';

const classes = createStyle(() => ({
    properties: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        padding: '5px',
        overflowY: 'auto'
    },
    container: {
        display: 'grid',
        gridTemplateRows: 'max-content auto',
        gap: '5px',
        padding: '5px',
        border: `1px solid ${Theme().outline.primary}`,
        borderRadius: '5px',
        overflow: 'hidden',
        background: Theme().background.color,
        color: Theme().background.text
    },
    header: {
        display: 'grid',
        gridTemplateColumns: 'max-content auto max-content',
        alignItems: 'center',
        gap: '5px',
        fontWeight: 'bold'
    },
    attributeName: {
        color: Theme().background.subText
    }
}));

export function PropertiesPanelSectionComponent(props: { icon: Icon, title: string, actions?: JSX.Element | JSX.Element[], children: JSX.Element }) {

    return (
        <div class={classes().container}>
            <div class={classes().header}>
                <Icon name={props.icon} />
                <span>{props.title}</span>
                {props.actions}
            </div>
            {props.children}
        </div>
    );
}


export const ElementPropertiesPanelComponent = defineComponent((props: { elementId: string }) => {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);
    const element = shtml.elements[props.elementId];

    const locals = createMemo(() => service.platform.shtml.getLocals(element.id()));
    const attributes = createMemo(() => {
        const normal: Record<string, string> = {};
        const events: Record<string, string> = {};
        const styles: Record<string, string> = {};
        const classes: Record<string, string> = {};
        const attributes = element.attributes();
        for (const attribute in attributes) {
            if (attribute.startsWith('style.')) styles[attribute] = attributes[attribute];
            else if (attribute.startsWith('class.')) classes[attribute] = attributes[attribute];
            else if ($Element.isEventAttribute(document.createElement(element.type()), attribute)) events[attribute] = attributes[attribute];
            else normal[attribute] = attributes[attribute];
        }
        return {
            normal,
            events,
            styles,
            classes
        };
    });

    function removeAttribute(name: string) {
        const next = { ...element.attributes() };
        delete next[name];
        element.attributes(next);
    }

    function renameAttribute(oldName: string, newName: string) {
        const next = { ...element.attributes() };
        const value = next[oldName];
        delete next[oldName];
        next[newName] = value;
        element.attributes(next);
    }

    return (
        <PanelComponent icon='sliders-horizontal' title='Element Properties'>
            <div class={classes().properties}>
                <PropertiesPanelSectionComponent icon='list' title='Attributes' actions={(
                    <ButtonComponent
                        appearance='dashed'
                        icon='plus'
                        onClick={() => element.attributes(attributes => ({ ...attributes, ['[attribute]']: '' }))}
                    />
                )}>
                    <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr max-content', gap: '5px', 'align-items': 'center' }}>
                        <ForIn each={attributes().normal}>
                            {(attributeValue, attributeName) => (
                                <>
                                    <span
                                        class={classes().attributeName}
                                        contentEditable
                                        onBlur={value => element.attributes(attributes => MapAdaptor.rename(attributes, attributeName, value.currentTarget.innerText))}>
                                        {attributeName}
                                    </span>
                                    <BindingInputComponent
                                        locals={locals()}
                                        value={attributeValue()}
                                        accepts={$Tson.string()}
                                        onChange={value => element.attributes(attributes => ({ ...attributes, [attributeName]: value }))}
                                    />
                                    <ButtonComponent
                                        appearance='flat'
                                        icon='minus'
                                        onClick={() => element.attributes(attributes => MapAdaptor.delete(attributes, attributeName))}
                                    />
                                </>
                            )}
                        </ForIn>
                    </div>
                </PropertiesPanelSectionComponent>
                <PropertiesPanelSectionComponent icon='zap' title='Events' actions={(
                    <ButtonComponent
                        appearance='dashed'
                        icon='plus'
                        onClick={() => element.attributes(attributes => ({ ...attributes, [$Element.getEventProperties('div')[0]]: '' }))}
                    />
                )}>
                    <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr max-content', gap: '5px', 'align-items': 'center' }}>
                        <ForIn each={attributes().events}>
                            {(attributeValue, attributeName) => (
                                <>
                                    <span
                                        class={classes().attributeName}
                                        contentEditable
                                        onBlur={value => element.attributes(attributes => MapAdaptor.rename(attributes, attributeName, value.currentTarget.innerText))}>
                                        {attributeName}
                                    </span>
                                    <BindingInputComponent
                                        locals={locals()}
                                        value={attributeValue()}
                                        accepts={$Tson.string()}
                                        onChange={value => element.attributes(attributes => ({ ...attributes, [attributeName]: value }))}
                                    />
                                    <ButtonComponent
                                        appearance='flat'
                                        icon='minus'
                                        onClick={() => element.attributes(attributes => MapAdaptor.delete(attributes, attributeName))}
                                    />
                                </>
                            )}
                        </ForIn>
                    </div>
                </PropertiesPanelSectionComponent>
                <PropertiesPanelSectionComponent icon='tag' title='Classes' actions={(
                    <ButtonComponent
                        appearance='dashed'
                        icon='plus'
                        onClick={() => element.attributes(attributes => ({ ...attributes, ['class.[attribute]']: '' }))}
                    />
                )}>
                    <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr max-content', gap: '5px', 'align-items': 'center' }}>
                        <ForIn each={attributes().classes}>
                            {(attributeValue, attributeName) => (
                                <>
                                    <span
                                        class={classes().attributeName}
                                        contentEditable
                                        onBlur={value => element.attributes(attributes => MapAdaptor.rename(attributes, attributeName, value.currentTarget.innerText))}>
                                        {attributeName}
                                    </span>
                                    <BindingInputComponent
                                        locals={locals()}
                                        value={attributeValue()}
                                        accepts={$Tson.string()}
                                        onChange={value => element.attributes(attributes => ({ ...attributes, [attributeName]: value }))}
                                    />
                                    <ButtonComponent
                                        appearance='flat'
                                        icon='minus'
                                        onClick={() => element.attributes(attributes => MapAdaptor.delete(attributes, attributeName))}
                                    />
                                </>
                            )}
                        </ForIn>
                    </div>
                </PropertiesPanelSectionComponent>
                <PropertiesPanelSectionComponent icon='palette' title='Style' actions={(
                    <ButtonComponent
                        appearance='dashed'
                        icon='plus'
                        onClick={() => element.attributes(attributes => ({ ...attributes, ['style.[attribute]']: '' }))}
                    />
                )}>
                    <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr max-content', gap: '5px', 'align-items': 'center' }}>
                        <ForIn each={attributes().styles}>
                            {(attributeValue, attributeName) => (
                                <>
                                    <span
                                        class={classes().attributeName}
                                        contentEditable
                                        onBlur={value => element.attributes(attributes => MapAdaptor.rename(attributes, attributeName, value.currentTarget.innerText))}>
                                        {attributeName}
                                    </span>
                                    <BindingInputComponent
                                        locals={locals()}
                                        value={attributeValue()}
                                        accepts={$Tson.string()}
                                        onChange={value => element.attributes(attributes => ({ ...attributes, [attributeName]: value }))}
                                    />
                                    <ButtonComponent
                                        appearance='flat'
                                        icon='minus'
                                        onClick={() => element.attributes(attributes => MapAdaptor.delete(attributes, attributeName))}
                                    />
                                </>
                            )}
                        </ForIn>
                    </div>
                </PropertiesPanelSectionComponent>
            </div>
        </PanelComponent>
    );
});
