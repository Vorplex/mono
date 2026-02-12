import { $Id, $String, $Value, type CamelToKebab, State, type Update } from '@vorplex/core';
import { Accessor, type JSX, createMemo, onCleanup } from 'solid-js';

export type StyleNames<T> = { [name in keyof T]: string };

export type StyleClass = CssProperties | { [property: string]: StyleClass };

export type StyleClasses<T extends object = any> = {
    [name in keyof T]: StyleClass;
};

export type StyleSheet = {
    element: HTMLStyleElement;
    css: string;
};

export type ClassStyleSheet<T extends object> = StyleSheet & {
    classes: StyleNames<T>;
    value: StyleClasses<T>;
};
export type AnimationStyleSheet = StyleSheet & { name: string };

export type CssProperties = {
    [key in keyof JSX.CSSProperties as CamelToKebab<key>]: JSX.CSSProperties[key] | CssProperties;
};

export class $StyleSheet {
    private constructor() { }

    public static parseClass(selector: string, properties: CssProperties): string {
        let css = `${selector} {\n`;
        let suffix = '';
        for (const rule in properties) {
            const value = properties[rule as keyof CssProperties];
            if (typeof value === 'string') {
                css += `\t${$String.kebabCase(rule)}: ${value};\n`;
            } else {
                for (const childSelector of rule.split(',')) {
                    suffix += $StyleSheet.parseClass(childSelector.trim().split('&').join(selector), value as {} as CssProperties);
                }
            }
        }
        css += `}`;
        return `${css}\n${suffix}\n`;
    }

    public static parseAnimation(name: string, animation: Record<string, CssProperties>): string {
        let css = `@keyframes ${name} {\n`;
        for (const state in animation) {
            css += `${state} {\n`;
            for (const rule in animation[state]) {
                const value = (animation[state] as any)[rule];
                css += `\t${$String.kebabCase(rule)}: ${value};\n`;
            }
            css += `}\n`;
        }
        css += '}\n';
        return css;
    }

    public static parse<T extends { [rule: string]: CssProperties }>(style: T, classNames?: StyleNames<T>): { classes: StyleNames<T>; css: string } {
        const classes: { [className in keyof T]: string } = classNames ?? ({} as any);
        let css = '';
        for (const name in style) {
            if (name === '_') {
                for (const key in style[name]) {
                    css += $StyleSheet.parseClass(key, style[name][key] as CssProperties);
                }
            } else {
                classes[name] = classes[name] ?? `${name}-${$Id.uid()}`;
                css += $StyleSheet.parseClass(`.${classes[name]}`, style[name]);
            }
        }
        return {
            classes,
            css,
        };
    }

    public static create<T extends object>(styles: () => StyleClasses<T>, container?: Node): Accessor<ClassStyleSheet<T>> {
        container ??= document.head;
        const sheet = document.createElement('style');
        sheet.toggleAttribute('style-classes');
        container.appendChild(sheet);
        onCleanup(() => sheet.remove());
        return createMemo(() => $StyleSheet.updateSheet(sheet, styles()));
    }

    public static createAnimation(animation: Record<string, CssProperties>): AnimationStyleSheet {
        const element = document.createElement('style');
        element.toggleAttribute('animation');
        document.head.appendChild(element);
        const name = `anim-${$Id.uid()}`;
        const css = $StyleSheet.parseAnimation(name, animation);
        element.innerHTML = css;
        return {
            element,
            css,
            name,
        };
    }

    public static update<T extends object>(style: ClassStyleSheet<T>, changes: Update<StyleClasses<T>> = {} as Update<StyleClasses<T>>): ClassStyleSheet<T> {
        changes = State.update(style.value, changes);
        if ($Value.equals(style.value, changes)) return style;
        const { classes, css } = $StyleSheet.parse<any>(changes, style.classes);
        style.element.innerHTML = css;
        style.value = changes as any;
        return {
            element: style.element,
            css,
            classes: classes,
            value: style.value,
        };
    }

    public static updateSheet<T extends object>(element: HTMLStyleElement, styles: StyleClasses<T>): ClassStyleSheet<T> {
        const { classes, css } = $StyleSheet.parse(styles);
        if (element.innerHTML !== css) {
            element.innerHTML = css;
        }
        return {
            element: element,
            css,
            classes,
            value: styles,
        };
    }
}
