import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketClient {
    constructor() {
        this.socket = null;
        this.hospitalId = null;
    }

    connect(hospitalId = null) {
        if (this.socket) return this.socket;

        this.hospitalId = hospitalId;
        this.socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('🏥 Hospital Socket connected:', this.socket.id);
            // Join hospital-specific room if hospital ID is provided
            if (this.hospitalId) {
                this.socket.emit('join:hospital', this.hospitalId);
            }
        });

        this.socket.on('connect_error', (err) => {
            console.error('🔴 Socket connection error:', err.message);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔵 Socket disconnected:', reason);
        });

        return this.socket;
    }

    joinHospital(hospitalId) {
        this.hospitalId = hospitalId;
        if (this.socket && this.socket.connected) {
            this.socket.emit('join:hospital', hospitalId);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
        return () => this.socket?.off(event, callback);
    }

    emit(event, data) {
        if (!this.socket) this.connect();
        this.socket.emit(event, data);
    }

    getSocket() {
        return this.socket;
    }
}

export const socket = new SocketClient();
