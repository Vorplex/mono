import { Accessor, onCleanup } from 'solid-js';
import { $StyleSheet, type StyleClasses, type StyleNames } from '../utils/style-sheet.util';

export function createStyle<T extends object>(styles: () => StyleClasses<T>, container?: Node): Accessor<StyleNames<T>> {
    const style = $StyleSheet.create<T>(styles, container);
    onCleanup(() => style().element.remove());
    return () => style().classes;
}