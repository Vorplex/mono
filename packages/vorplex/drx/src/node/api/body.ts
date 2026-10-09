import { TsonDefinition } from '@vorplex/core';
import { DrxDom } from '../../dom';
import type { DrxDocumentState } from '../../document';
import { NodeType } from '../node-type';

export type DrxApiBodyEncoding = 'json' | 'form-data' | 'urlencoded';

export interface DrxApiBody {
    id: string;
    encoding?: DrxApiBodyEncoding;
    definition: TsonDefinition;
}

export const DrxApiBody = class {

    public static readonly encodings: DrxApiBodyEncoding[] = ['json', 'form-data', 'urlencoded'];

    public static parse(element: Element, state: DrxDocumentState): DrxApiBody {
        const encoding = DrxDom.getAttribute(element, 'encoding') as DrxApiBodyEncoding;
        const body: DrxApiBody = {
            id: DrxDom.getId(element),
            encoding: DrxApiBody.encodings.includes(encoding) ? encoding : undefined,
            definition: DrxDom.getJsonContent(element) ?? { type: 'any' }
        };
        state.apiBodies[body.id] = body;
        return body;
    }

    public static to(body: DrxApiBody): Element {
        const element = document.createElement(NodeType.ApiBody);
        DrxDom.setAttribute(element, 'id', body.id);
        DrxDom.setAttribute(element, 'encoding', body.encoding);
        DrxDom.setJsonContent(element, body.definition);
        return element;
    }

}
