// Utility functions for the transport provider platform

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
}

// Format date/time
export const formatDateTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Format time only
export const formatTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Get severity color
export const getSeverityColor = (severity) => {
    const colors = {
        critical: '#ef4444',
        urgent: '#f97316',
        high: '#f97316',
        medium: '#3b82f6',
        stable: '#3b82f6',
        low: '#10b981',
        non_urgent: '#10b981',
        routine: '#10b981'
    }
    return colors[severity] || '#6b7280'
}

// Get status color
export const getStatusColor = (status) => {
    const colors = {
        available: '#10b981',
        on_trip: '#f59e0b',
        off_duty: '#6b7280',
        maintenance: '#ef4444',
        pending: '#3b82f6',
        assigned: '#8b5cf6',
        in_progress: '#f59e0b',
        completed: '#10b981',
        cancelled: '#ef4444'
    }
    return colors[status] || '#6b7280'
}

// Generate invitation link
export const generateInvitationLink = (token) => {
    // Use production URL or environment variable
    const baseUrl = import.meta.env.VITE_DRIVER_APP_URL || 'https://island-driver-app.vercel.app'
    return `${baseUrl}/register?token=${token}`
}

// Copy to clipboard
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (err) {
        console.error('Failed to copy:', err)
        return false
    }
}
