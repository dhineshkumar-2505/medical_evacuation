import { useState, useEffect } from 'react'
import { Bug, X, Wifi, WifiOff, CheckCircle, AlertCircle, Database, Activity } from 'lucide-react'
import './DevPanel.css'

export default function DevPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [logs, setLogs] = useState([])
    const [connectionStatus, setConnectionStatus] = useState({
        supabase: 'unknown',
        realtime: 'unknown'
    })

    useEffect(() => {
        // Intercept console methods
        const originalLog = console.log
        const originalError = console.error
        const originalWarn = console.warn

        console.log = (...args) => {
            originalLog(...args)
            addLog('info', args.join(' '))
        }

        console.error = (...args) => {
            originalError(...args)
            addLog('error', args.join(' '))
        }

        console.warn = (...args) => {
            originalWarn(...args)
            addLog('warning', args.join(' '))
        }

        // Check Supabase connection
        checkSupabaseConnection()

        // Listen for custom events
        window.addEventListener('supabase-connected', () => {
            setConnectionStatus(prev => ({ ...prev, supabase: 'connected' }))
            addLog('success', 'Supabase connected')
        })

        window.addEventListener('supabase-disconnected', () => {
            setConnectionStatus(prev => ({ ...prev, supabase: 'disconnected' }))
            addLog('error', 'Supabase disconnected')
        })

        window.addEventListener('realtime-connected', () => {
            setConnectionStatus(prev => ({ ...prev, realtime: 'connected' }))
            addLog('success', 'Realtime subscription active')
        })

        window.addEventListener('realtime-disconnected', () => {
            setConnectionStatus(prev => ({ ...prev, realtime: 'disconnected' }))
            addLog('warning', 'Realtime subscription inactive')
        })

        return () => {
            console.log = originalLog
            console.error = originalError
            console.warn = originalWarn
        }
    }, [])

    const checkSupabaseConnection = async () => {
        // Check if we can import supabase from the app
        // For now, assume connected if the env var is set
        if (import.meta.env.VITE_SUPABASE_URL) {
            setConnectionStatus(prev => ({ ...prev, supabase: 'connected' }))
            addLog('success', 'Supabase initialized')
        } else {
            setConnectionStatus(prev => ({ ...prev, supabase: 'error' }))
            addLog('error', 'Supabase URL not configured')
        }
    }

    const addLog = (type, message) => {
        const timestamp = new Date().toLocaleTimeString()
        setLogs(prev => [{
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            timestamp
        }, ...prev].slice(0, 100)) // Keep last 100 logs
    }

    const clearLogs = () => {
        setLogs([])
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'connected':
                return <Wifi size={16} className="status-icon connected" />
            case 'disconnected':
                return <WifiOff size={16} className="status-icon disconnected" />
            case 'error':
                return <AlertCircle size={16} className="status-icon error" />
            default:
                return <Activity size={16} className="status-icon unknown" />
        }
    }

    const getLogIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={14} className="log-icon success" />
            case 'error':
                return <AlertCircle size={14} className="log-icon error" />
            case 'warning':
                return <AlertCircle size={14} className="log-icon warning" />
            default:
                return <Activity size={14} className="log-icon info" />
        }
    }

    return (
        <>
            {/* Floating Debug Button */}
            <button
                className="dev-panel-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Developer Debug Panel"
            >
                <Bug size={20} />
                {(connectionStatus.supabase === 'error' || connectionStatus.realtime === 'error') && (
                    <span className="error-indicator"></span>
                )}
            </button>

            {/* Debug Panel */}
            {isOpen && (
                <div className="dev-panel">
                    <div className="dev-panel-header">
                        <h3>
                            <Bug size={18} />
                            Developer Panel
                        </h3>
                        <button onClick={() => setIsOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="dev-panel-content">
                        {/* Connection Status */}
                        <div className="dev-section">
                            <h4>Connection Status</h4>
                            <div className="status-grid">
                                <div className="status-item">
                                    <Database size={16} />
                                    <span>Supabase</span>
                                    {getStatusIcon(connectionStatus.supabase)}
                                    <span className={`status-text ${connectionStatus.supabase}`}>
                                        {connectionStatus.supabase}
                                    </span>
                                </div>
                                <div className="status-item">
                                    <Activity size={16} />
                                    <span>Realtime</span>
                                    {getStatusIcon(connectionStatus.realtime)}
                                    <span className={`status-text ${connectionStatus.realtime}`}>
                                        {connectionStatus.realtime}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="dev-section">
                            <h4>System Info</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Environment:</span>
                                    <span className="info-value">{import.meta.env.MODE}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">User Agent:</span>
                                    <span className="info-value">{navigator.userAgent.split(' ')[0]}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Online:</span>
                                    <span className="info-value">{navigator.onLine ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="dev-section">
                            <div className="dev-section-header">
                                <h4>Console Logs ({logs.length})</h4>
                                <button onClick={clearLogs} className="btn-clear">
                                    Clear
                                </button>
                            </div>
                            <div className="logs-container">
                                {logs.length === 0 ? (
                                    <div className="no-logs">No logs yet</div>
                                ) : (
                                    logs.map(log => (
                                        <div key={log.id} className={`log-entry ${log.type}`}>
                                            {getLogIcon(log.type)}
                                            <span className="log-time">{log.timestamp}</span>
                                            <span className="log-message">{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Helper function to dispatch connection events
export const emitConnectionEvent = (type, status) => {
    window.dispatchEvent(new CustomEvent(`${type}-${status}`))
}
