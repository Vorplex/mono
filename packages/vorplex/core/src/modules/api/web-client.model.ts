import { $Id } from '../id/id.util';
import { State } from '../state/state.model';
import { Emitter } from '../subscribable/subscribable.model';
import { ISocket } from './socket.model';

export class WebClient {

    private readonly state = new State<'none' | 'open' | 'closed'>('none');

    public readonly id: string = $Id.uuid();
    public readonly stream = new Emitter<any>();
    public get connected(): boolean {
        return this.socket && this.socket.readyState === this.socket.OPEN;
    }
    public readonly status = this.state.asReadOnly();

    constructor(public socket: ISocket, public address?: string) {
        socket.onopen = () => this.state.update('open');
        socket.onclose = () => this.state.update('closed');
        socket.onmessage = (message) => {
            let data = message.data;
            try { data = JSON.parse(data); } catch { }
            this.stream.emit(data);
        };
    }

    public send(packet: any) {
        this.socket.send(JSON.stringify(packet));
    }

    public disconnect() {
        this.socket.close();
    }
}
