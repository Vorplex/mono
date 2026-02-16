import { $Id, $String, $Value, type CamelToKebab, State, type Update } from '@vorplex/core';
import { Accessor, type JSX, createMemo } from 'solid-js';

export type StyleNames<T> = { [name in keyof T]: string };

export type CssProperties = {
    [key in keyof JSX.CSSProperties as CamelToKebab<key>]: JSX.CSSProperties[key] | CssProperties;
};

export type StyleClass = CssProperties | { [property: string]: StyleClass };

export type StyleClasses<T extends Record<string, any> = any> = {
    [name in keyof T]: StyleClass;
};

export interface StyleSheet {
    sheet: CSSStyleSheet;
    css: string;
}

export interface ClassStyleSheet<T extends Record<string, any>> extends StyleSheet {
    classes: StyleNames<T>;
    value: StyleClasses<T>;
}

export interface AnimationStyleSheet extends StyleSheet {
    name: string;
}

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

    public static create<T extends object>(styles: () => StyleClasses<T>): Accessor<ClassStyleSheet<T>> {
        const sheet = new CSSStyleSheet();
        return createMemo(() => {
            const value = styles();
            const { classes, css } = $StyleSheet.parse(value);
            sheet.replaceSync(css);
            return {
                classes,
                css,
                sheet,
                value
            };
        });
    }

    public static createAnimation(animation: () => Record<string, CssProperties>): Accessor<AnimationStyleSheet> {
        const sheet = new CSSStyleSheet();
        const name = `anim-${$Id.uid()}`;
        return createMemo(() => {
            const css = $StyleSheet.parseAnimation(name, animation());
            sheet.replaceSync(css);
            return {
                sheet,
                css,
                name
            };
        });
    }

    public static update<T extends object>(style: ClassStyleSheet<T>, changes: Update<StyleClasses<T>> = {} as Update<StyleClasses<T>>): ClassStyleSheet<T> {
        changes = State.update(style.value, changes);
        if ($Value.equals(style.value, changes)) return style;
        const { classes, css } = $StyleSheet.parse<any>(changes, style.classes);
        style.sheet.replaceSync(css);
        style.value = changes as any;
        return {
            sheet: style.sheet,
            css,
            classes: classes,
            value: style.value,
        };
    }
}
