import { Scope, Signal, SignalProxy } from '@vorplex/core';

export interface ModalApi {
    data: SignalProxy<any>;
    close(result?: any): void;
}

interface ModalFrame {
    data: SignalProxy<any>;
    host: HTMLDialogElement;
    root: Scope;
    resolve: (result: any) => void;
    result?: any;
}

export const ModalManager = {
    open(mount: (container: Node, api: ModalApi) => void, options: { data?: any } = {}): Promise<any> {
        return new Promise(resolve => {
            const host = document.createElement('dialog');
            host.className = 'x-modal';
            host.style.cssText = `
                position: fixed;
                inset: 0;
                margin: 0;
                padding: 0;
                border: none;
                width: 100%;
                height: 100%;
                max-width: none;
                max-height: none;
                background: transparent;
            `;
            document.body.appendChild(host);
            const frame: ModalFrame = {
                host,
                root: null,
                data: Signal.create(options.data).proxy,
                resolve
            };
            const api: ModalApi = {
                data: frame.data,
                close: (result?: any) => {
                    frame.result = result;
                    frame.host.close();
                }
            };
            host.addEventListener('close', () => {
                frame.root.dispose();
                frame.host.remove();
                frame.resolve(frame.result);
            }, { once: true });
            frame.root = Signal.root(() => mount(host, api));
            host.showModal();
        });
    }
};

