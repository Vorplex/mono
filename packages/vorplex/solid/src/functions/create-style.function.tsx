import { Accessor, createEffect, onCleanup } from 'solid-js';
import { $StyleSheet, CssProperties, type StyleClasses, type StyleNames } from '../utils/style-sheet.util';

export function createStyle<T extends object>(styles: () => StyleClasses<T>, container?: Node): Accessor<StyleNames<T>> {
    const style = $StyleSheet.create<T>(styles);
    const element = document.createElement('style') as HTMLStyleElement;
    (container ?? document.head).appendChild(element);
    createEffect(() => element.innerText = style().css);
    onCleanup(() => element.remove());
    return () => style().classes;
}

export function createAnimation<T extends object>(styles: () => Record<string, CssProperties>, container?: Node): Accessor<string> {
    const style = $StyleSheet.createAnimation(styles);
    const element = document.createElement('style') as HTMLStyleElement;
    (container ?? document.head).appendChild(element);
    createEffect(() => element.innerText = style().css);
    onCleanup(() => element.remove());
    return () => style().name;
}
