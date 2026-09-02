import { $Tson, MapAdaptor } from '@vorplex/core';
import { NodeType, ShtmlElement } from '@vorplex/shtml';
import { createStyle, defineRemountingComponent, ForIn, useInjector, useStore } from '@vorplex/solid';
import { $Element } from '@vorplex/web';
import { createMemo, JSX, Show } from 'solid-js';
import { ButtonComponent } from '../../../../../../components/button.component';
import { FieldComponent, FormInputComponent } from '../../../../../../components/forms/form-input.component';
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

export const ElementPropertiesPanelComponent = defineRemountingComponent((props: { elementId: string }) => {

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

    const textValue = createMemo(() => {
        const template = element.template();
        if (!template) return undefined;
        if (template.length === 0) return '';
        if (template.length === 1 && template[0].type === NodeType.Text) return shtml.texts[template[0].id].content();
        return undefined;
    });

    const tags = [
        'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
        'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
        'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
        'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
        'em', 'embed',
        'fieldset', 'figcaption', 'figure', 'footer', 'form',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
        'i', 'iframe', 'img', 'input', 'ins',
        'kbd',
        'label', 'legend', 'li', 'link',
        'main', 'map', 'mark', 'menu', 'meta', 'meter',
        'nav', 'noscript',
        'object', 'ol', 'optgroup', 'option', 'output',
        'p', 'picture', 'pre', 'progress',
        'q',
        'rp', 'rt', 'ruby',
        's', 'samp', 'script', 'search', 'section', 'select', 'slot',
        'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup',
        'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th',
        'thead', 'time', 'title', 'tr', 'track',
        'u', 'ul',
        'var', 'video',
        'wbr'
    ];

    return (
        <PanelComponent icon='sliders-horizontal' title='Element Properties'>
            <div class={classes().properties}>
                <FormInputComponent
                    type={'text-option'}
                    label={'Type'}
                    options={tags}
                    value={element.tag()}
                    onChange={value => element.tag(value)}
                />
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
                <Show when={textValue() !== undefined}>
                    <FieldComponent label={'Text'}>
                        <BindingInputComponent
                            locals={locals()}
                            value={textValue()}
                            accepts={$Tson.string()}
                            onChange={value => {
                                const state = service.platform.shtml.state.value;
                                service.platform.shtml.state.set(ShtmlElement.setText(state.elements[props.elementId], state, value));
                            }}
                        />
                    </FieldComponent>
                </Show>
            </div>
        </PanelComponent>
    );
});
