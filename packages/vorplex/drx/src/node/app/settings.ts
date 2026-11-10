import { $Url } from '@vorplex/core';
import { DrxDom } from '../../dom';
import { NodeType } from '../node-type';

export type DrxSettingsValue = Record<string, any>;

export type DrxSettings =
    | { type: 'inline'; value: DrxSettingsValue }
    | { type: 'external'; src: string; value: DrxSettingsValue };

export const DrxSettings = class {

    public static readonly file = 'settings.json';

    public static parse(element: Element): DrxSettings {
        const value = DrxDom.getJsonContent(element) ?? {};
        const src = DrxDom.getAttribute(element, 'src');
        if (!src) return { type: 'inline', value };
        return { type: 'external', src: $Url.isAbsolute(src) ? src : DrxDom.resolvePath(element, src), value };
    }

    public static to(settings: DrxSettings): Element {
        const element = document.createElement(NodeType.Settings);
        if (settings.type === 'external') DrxDom.setAttribute(element, 'src', settings.src);
        else DrxDom.setJsonContent(element, settings.value);
        return element;
    }

    public static stringify(value: DrxSettingsValue): string {
        return `${JSON.stringify(value, null, 4)}\n`;
    }

}
