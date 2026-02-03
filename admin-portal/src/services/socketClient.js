import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

class SocketClient {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (this.socket) return this.socket;

        this.socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('🟢 Socket connected:', this.socket.id);
            this.socket.emit('join:admin');
        });

        this.socket.on('connect_error', (err) => {
            console.error('🔴 Socket connection error:', err);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Subscribe to events
    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
        return () => this.socket.off(event, callback);
    }
}

export const socket = new SocketClient();
