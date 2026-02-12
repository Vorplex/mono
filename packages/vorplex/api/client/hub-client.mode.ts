import { $Id, Subscription, WebClient } from '@vorplex/core';

export class HubClient {

    constructor(public client: WebClient, public name: string) {
    }

    public invoke(action: string, data?: any): void {
        this.client.send({
            id: $Id.uuid(),
            hub: this.name,
            action,
            data
        });
    }

    public request<T>(action: string, data?: any): Promise<T> {
        const id = $Id.uuid();
        return new Promise((resolve, reject) => {
            this.client.stream.until(packet => typeof packet === 'object' && packet != null && packet.id === id).then(packet => {
                if ('error' in packet) reject(packet.error);
                else if ('data' in packet) resolve(packet.data);
            });
            this.client.send({
                id,
                hub: this.name,
                action,
                data
            });
        });
    }

    public subscribe<T>(action: string, data: any, callback: (result: T) => void): Subscription {
        const id = $Id.uuid();
        const subscription = this.client.stream.subscribe(packet => {
            if (typeof packet === 'object' && packet != null && packet.id === id) {
                callback(packet.data);
            }
        })
        this.client.send({
            id,
            hub: this.name,
            action,
            data
        });
        return {
            unsubscribe: () => subscription.unsubscribe()
        };
    }

}
