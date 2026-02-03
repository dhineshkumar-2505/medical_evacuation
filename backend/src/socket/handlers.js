/**
 * Socket.io Event Handlers
 * Handles real-time WebSocket connections
 */

export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Join rooms based on user role/clinic
        socket.on('join:clinic', (clinicId) => {
            socket.join(`clinic:${clinicId}`);
            console.log(`Socket ${socket.id} joined clinic:${clinicId}`);
        });

        socket.on('join:admin', () => {
            socket.join('admin');
            console.log(`Socket ${socket.id} joined admin room`);
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
        });
    });

    // Return helper to emit to specific rooms
    return {
        toClinic: (clinicId, event, data) => {
            io.to(`clinic:${clinicId}`).emit(event, data);
        },
        toAdmin: (event, data) => {
            io.to('admin').emit(event, data);
        },
        toAll: (event, data) => {
            io.emit(event, data);
        }
    };
}
