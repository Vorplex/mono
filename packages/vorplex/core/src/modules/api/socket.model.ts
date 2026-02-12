import { $Object } from '../object/object.util';
import { State } from '../state/state.model';
import { Emitter } from '../subscribable/subscribable.model';

const SOCKET = null;

export class ISocket {
    readyState: number;
    OPEN: number;
    onmessage: (message) => void;
    onerror: (error) => void;
    onclose: (event?: any) => void;
    send: (data: any) => void;
    onopen: (event) => void;
    close: () => void;
}

export type SocketOptions = {
    url: string;
    autoReconnect?: boolean;
    retryInterval?: number;
};

export class Socket {
    private socket: ISocket;
    private state = new State<'open' | 'closed'>(null);

    public readonly stream = new Emitter<any>();
    public get connected(): boolean {
        return this.socket && this.socket.readyState === this.socket.OPEN;
    }

    private constructor() {}

    public static async connect(options: SocketOptions): Promise<Socket> {
        options = $Object.getDefaults(options, { retryInterval: 1000 });
        const connect = (socket: Socket) => {
            return new Promise<Socket>((resolve, reject) => {
                const stream: ISocket = (socket.socket = new SOCKET(options.url));
                stream.onopen = () => {
                    resolve(socket);
                    socket.state.update('open');
                };
                stream.onmessage = (message) => socket.stream.emit(JSON.parse(message.data));
                stream.onclose = () => {
                    if (socket.state.value !== 'closed') {
                        socket.state.update('closed');
                        if (options.autoReconnect) {
                            const retry = async () => {
                                try {
                                    await connect(socket);
                                } catch {
                                    await new Promise((resolve) => setTimeout(resolve, options.retryInterval));
                                    await retry();
                                }
                            };
                            retry();
                        }
                    }
                };
                stream.onerror = (error) => {
                    reject(error);
                    socket.stream.emit(error);
                };
            });
        };
        const socket: Socket = new (Socket as any)();
        return connect(socket);
    }

    public send(request: any) {
        this.socket.send(JSON.stringify(request));
    }

    public disconnect() {
        this.state.update('closed');
        this.socket.close();
    }
}
