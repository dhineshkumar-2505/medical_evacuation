# Developer Debug Panel

Reusable debug panel component for monitoring app health, connections, and logs.

## Features

- 🔌 **Connection Status** - Monitor Supabase and Realtime connections
- 📊 **Console Logs** - Capture and display console.log, console.error, console.warn
- ℹ️ **System Info** - Environment, user agent, online status
- 🎨 **Beautiful UI** - Purple gradient theme with dark console
- 🔴 **Error Indicator** - Red dot appears on icon when errors occur

## Usage

### 1. Add to Provider App

```jsx
// transport-provider-app/src/App.jsx
import DevPanel from '../../../shared-components/DevPanel'

function App() {
  return (
    <div>
      {/* Your app content */}
      <DevPanel />
    </div>
  )
}
```

### 2. Add to Driver App

```jsx
// driver-app/src/App.jsx
import DevPanel from '../../shared-components/DevPanel'

function App() {
  return (
    <div>
      {/* Your app content */}
      <DevPanel />
    </div>
  )
}
```

### 3. Emit Connection Events

```jsx
import { emitConnectionEvent } from '../../../shared-components/DevPanel'

// When Supabase connects
emitConnectionEvent('supabase', 'connected')

// When Realtime subscription starts
emitConnectionEvent('realtime', 'connected')

// When disconnected
emitConnectionEvent('realtime', 'disconnected')
```

## Visual

- **Floating Button**: Bottom-right purple gradient circle with bug icon
- **Error Indicator**: Red pulsing dot appears on button when errors occur
- **Panel**: Opens as overlay with connection status, system info, and logs
- **Dark Console**: Terminal-style log display with color-coded messages

## Benefits for Development

✅ Instantly see if Realtime is working
✅ Monitor connection issues
✅ Track errors without opening DevTools
✅ Great for testing on mobile devices
✅ Non-intrusive - only shows when needed
