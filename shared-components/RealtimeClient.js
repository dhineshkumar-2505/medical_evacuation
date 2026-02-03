// WebSocket Client for Real-Time Updates

class RealtimeClient {
    constructor(url = 'ws://localhost:5000') {
        this.url = url
        this.ws = null
        this.reconnectInterval = 3000
        this.listeners = new Map()
        this.isConnected = false
    }

    connect(userId, userType) {
        try {
            this.ws = new WebSocket(this.url)

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected')
                this.isConnected = true

                // Identify this client
                this.send({
                    type: 'identify',
                    userId,
                    userType
                })

                // Emit connection event for DevPanel
                window.dispatchEvent(new CustomEvent('realtime-connected'))
            }

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)
                    this.handleMessage(message)
                } catch (error) {
                    console.error('WebSocket message parse error:', error)
                }
            }

            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected')
                this.isConnected = false
                window.dispatchEvent(new CustomEvent('realtime-disconnected'))

                // Attempt to reconnect
                setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...')
                    this.connect(userId, userType)
                }, this.reconnectInterval)
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error)
            }
        } catch (error) {
            console.error('WebSocket connection error:', error)
        }
    }

    handleMessage(message) {
        const { type, ...data } = message

        // Call all registered listeners for this message type
        const listeners = this.listeners.get(type) || []
        listeners.forEach(callback => callback(data))

        // Log for debugging
        console.log(`📨 WebSocket message:`, type, data)
    }

    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, [])
        }
        this.listeners.get(eventType).push(callback)
    }

    off(eventType, callback) {
        const listeners = this.listeners.get(eventType)
        if (listeners) {
            this.listeners.set(
                eventType,
                listeners.filter(cb => cb !== callback)
            )
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data))
        } else {
            console.warn('WebSocket not connected, cannot send:', data)
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }
}

// Create singleton instance
export const realtimeClient = new RealtimeClient()

// Export class for testing
export default RealtimeClient
