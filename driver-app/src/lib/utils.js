// Format date and time for display
export function formatDateTime(dateString) {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    // If less than 1 hour ago, show relative time
    if (diffMins < 60) {
        return diffMins === 0 ? 'Just now' : `${diffMins}m ago`
    }

    // If less than 24 hours ago, show hours ago
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
        return `${diffHours}h ago`
    }

    // Otherwise show date and time
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Calculate distance between two coordinates in kilometers
export function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0

    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance
}

function toRad(degrees) {
    return degrees * (Math.PI / 180)
}

// Get current location
export function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'))
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                })
            },
            (error) => {
                reject(error)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    })
}

// Watch location changes
export function watchLocation(callback) {
    if (!navigator.geolocation) {
        console.error('Geolocation is not supported')
        return null
    }

    return navigator.geolocation.watchPosition(
        (position) => {
            callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            })
        },
        (error) => {
            console.error('Location watch error:', error)
        },
        {
            enableHighAccuracy: true,
            timeout: 60000,
            maximumAge: 60000
        }
    )
}

// Update driver location in database
export async function updateDriverLocation(supabase, driverId, latitude, longitude) {
    try {
        const { error } = await supabase
            .from('drivers')
            .update({
                current_latitude: latitude,
                current_longitude: longitude,
                last_location_update: new Date().toISOString()
            })
            .eq('id', driverId)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error updating location:', error)
        return false
    }
}

// Show browser notification
export function showNotification(title, options) {
    if (!('Notification' in window)) {
        console.log('Notifications not supported')
        return
    }

    if (Notification.permission === 'granted') {
        new Notification(title, options)
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                new Notification(title, options)
            }
        })
    }
}

// Request notification permission
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
}

// Play alert sound
export function playAlertSound() {
    const audio = new Audio('/alert.mp3')
    audio.play().catch((error) => {
        console.log('Could not play alert sound:', error)
    })
}
