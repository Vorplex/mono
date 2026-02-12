import { Subscribable } from '@vorplex/core';

export type ChromeExtensionMessage = {
    extension: string;
    type: string;
    data: any;
};
export type ChromeExtensionRequest<TType extends string = string, TRequest = any, TResponse = any> = { type: TType; request: TRequest; response: TResponse };
export type ChromeExtensionHandler<T extends ChromeExtensionRequest> = {
    [key in T['request']as T['type']]: (request: T['request']) => Promise<T['response']>;
};

export class ChromeExtension<TOutgoingContracts extends ChromeExtensionRequest, TIncomingContracts extends ChromeExtensionRequest> extends Subscribable<TIncomingContracts> {
    public static readonly isServiceWorker = typeof window === 'undefined' && typeof document === 'undefined';

    constructor(
        public name: string,
        public handlers: ChromeExtensionHandler<TIncomingContracts>,
    ) {
        super();
        chrome.runtime.onMessage.addListener((message: ChromeExtensionMessage, sender, sendResponse) => {
            (async () => {
                try {
                    if (typeof message === 'object' && message.extension === this.name) {
                        const response = await this.handlers[message.type]?.(message.data);
                        sendResponse(response);
                    }
                } catch (error) {
                    console.error(error);
                }
            })();
            return true;
        });
    }

    public async request<T extends TOutgoingContracts['type']>(type: T, data: (TOutgoingContracts & { type: T })['request']): Promise<(TOutgoingContracts & { type: T })['response']> {
        const message: ChromeExtensionMessage = {
            extension: this.name,
            type,
            data,
        };
        if (ChromeExtension.isServiceWorker) {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            return await chrome.tabs.sendMessage(tab.id, message);
        } else {
            return await chrome.runtime.sendMessage(message);
        }
    }
}
