# 🌐 WebSocket Integration Guide

## Simple Integration

Add a real-time synchronized clock to any HTML page:

### 1. Server Code (Save as `server.js`)

```javascript
const timeSync = require('precise-time-sync');

async function start() {
    await timeSync.sync();                    // Sync with NTP servers
    timeSync.startWebSocketServer(8080);      // Start WebSocket server
    timeSync.startAutoSync(60000);            // Stay synchronized
    console.log('Clock server ready: ws://localhost:8080');
}

start().catch(console.error);
```

### 2. HTML Code (Copy-paste into any webpage)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Synchronized Clock</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .clock { font-size: 3rem; font-weight: bold; color: #333; margin: 20px 0; }
        .status { font-size: 1rem; margin: 10px 0; }
        .connected { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>⏰ Precise Time</h1>
    <div class="clock" id="clock">--:--:--</div>
    <div class="status" id="status">Connecting...</div>
    
    <script>
        // Connect to TimeSync WebSocket server
        const ws = new WebSocket('ws://localhost:8080');
        const clock = document.getElementById('clock');
        const status = document.getElementById('status');
        
        ws.onopen = () => {
            status.textContent = 'Connected ✅';
            status.className = 'status connected';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'time') {
                const time = new Date(data.data.timestamp);
                clock.textContent = time.toLocaleTimeString();
            }
        };
        
        ws.onclose = () => {
            status.textContent = 'Disconnected ❌';
            status.className = 'status error';
        };
        
        // Request time every second
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'getTime' }));
            }
        }, 1000);
    </script>
</body>
</html>
```

### 3. Run It

```bash
node server.js
# Open your HTML file in any browser
```

**You now have a live synchronized clock!** 🎉

## How It Works

1. **Server**: Connects to NTP servers for precise time
2. **WebSocket**: Broadcasts time data to connected browsers  
3. **HTML**: Displays the synchronized time in real-time

## Integration Options

### Minimal Integration (Just the Clock)
```javascript
// In your existing HTML page
const ws = new WebSocket('ws://localhost:8080');
const clockElement = document.getElementById('your-clock-element');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'time') {
        clockElement.textContent = new Date(data.data.timestamp).toLocaleTimeString();
    }
};

setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'getTime' }));
    }
}, 1000);
```

### Custom Styling
The HTML/CSS above is just an example. You can style the clock however you want:

```css
.clock {
    font-family: 'Courier New', monospace;
    font-size: 4rem;
    color: #2c3e50;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
```

### Different Time Formats
```javascript
// 12-hour format
clock.textContent = new Date(data.data.timestamp).toLocaleTimeString('en-US', {
    hour12: true
});

// With date
clock.textContent = new Date(data.data.timestamp).toLocaleString();

// Custom format
const time = new Date(data.data.timestamp);
clock.textContent = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
```

## Production Tips

- Use `wss://` instead of `ws://` for HTTPS sites
- Add reconnection logic for robust connections
- Consider using environment variables for the WebSocket URL
- Monitor connection status and handle errors gracefully

## Troubleshooting

**"WebSocket connection failed"**
- Make sure the server is running (`node server.js`)
- Check the port (default: 8080)
- Verify firewall settings

**"Time not updating"**
- Check browser console for JavaScript errors
- Ensure the WebSocket connection is established
- Verify the server is syncing with NTP servers

### 1. Start the TimeSync Server

```javascript
const timeSync = require('precise-time-sync');

async function startClockServer() {
    // Synchronize first
    await timeSync.sync();
    
    // Start WebSocket server on port 8080
    timeSync.startWebSocketServer(8080);
    
    // Keep synchronized
    timeSync.startAutoSync(60000); // Every minute
    
    console.log('🌐 Clock server running on ws://localhost:8080');
}

startClockServer();
```

### 2. Create HTML Client

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Precise Clock</title>
</head>
<body>
    <div id="clock">Loading...</div>
    
    <script>
        // Connect to TimeSync server
        const ws = new WebSocket('ws://localhost:8080');
        const clockEl = document.getElementById('clock');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'time') {
                const time = new Date(data.data.timestamp);
                clockEl.textContent = time.toLocaleTimeString();
            }
        };
        
        // Request time every second
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'getTime' }));
            }
        }, 1000);
    </script>
</body>
</html>
```

That's it! You now have a real-time synchronized clock.

## Complete Implementation

### Server Side (Node.js)

```javascript
const timeSync = require('precise-time-sync');

async function createClockServer() {
    try {
        // Initial synchronization
        console.log('Synchronizing with NTP servers...');
        await timeSync.sync();
        
        // Start WebSocket server
        const port = timeSync.startWebSocketServer(8080);
        console.log(`WebSocket server started on port ${port}`);
        
        // Auto-sync every 5 minutes
        timeSync.startAutoSync(300000);
        
        // Listen to sync events
        timeSync.on('sync', (data) => {
            console.log(`Synchronized with ${data.server} (offset: ${data.offset}ms)`);
        });
        
        timeSync.on('error', (error) => {
            console.error('Sync error:', error.message);
        });
        
        console.log('✅ Real-time clock server ready!');
        console.log('Open your HTML file in a browser to see the clock');
        
    } catch (error) {
        console.error('Failed to start server:', error.message);
    }
}

createClockServer();
```

### Client Side (HTML + JavaScript)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Synchronized Clock</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f0f0f0;
        }
        .clock {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .time {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .status {
            margin-top: 1rem;
            padding: 0.5rem;
            border-radius: 5px;
        }
        .connected { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="clock">
        <div class="time" id="time">--:--:--</div>
        <div id="date">Loading...</div>
        <div class="status" id="status">Connecting...</div>
        
        <button onclick="forceSync()">Sync Now</button>
    </div>

    <script>
        let ws;
        const timeEl = document.getElementById('time');
        const dateEl = document.getElementById('date');
        const statusEl = document.getElementById('status');

        function connect() {
            ws = new WebSocket('ws://localhost:8080');
            
            ws.onopen = () => {
                statusEl.textContent = 'Connected to TimeSync';
                statusEl.className = 'status connected';
                requestTime();
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'time':
                        updateDisplay(data.data);
                        break;
                    case 'syncComplete':
                        statusEl.textContent = 'Sync completed';
                        break;
                    case 'error':
                        statusEl.textContent = 'Error: ' + data.message;
                        statusEl.className = 'status error';
                        break;
                }
            };

            ws.onerror = () => {
                statusEl.textContent = 'Connection error';
                statusEl.className = 'status error';
            };

            ws.onclose = () => {
                statusEl.textContent = 'Disconnected - Reconnecting...';
                statusEl.className = 'status error';
                setTimeout(connect, 3000);
            };
        }

        function updateDisplay(timeData) {
            const time = new Date(timeData.timestamp);
            timeEl.textContent = time.toLocaleTimeString();
            dateEl.textContent = time.toLocaleDateString();
        }

        function requestTime() {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'getTime' }));
            }
        }

        function forceSync() {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'sync' }));
                statusEl.textContent = 'Synchronizing...';
            }
        }

        // Start connection
        connect();
        
        // Update every second
        setInterval(requestTime, 1000);
    </script>
</body>
</html>
```

## WebSocket Messages

### From Client to Server

```javascript
// Request current time
ws.send(JSON.stringify({ type: 'getTime' }));

// Request synchronization
ws.send(JSON.stringify({ type: 'sync' }));
```

### From Server to Client

```javascript
// Time update
{
    type: 'time',
    data: {
        timestamp: '2024-12-30T15:30:45.123Z',
        offset: 42,
        synchronized: true
    }
}

// Sync completed
{
    type: 'syncComplete',
    message: 'Synchronization completed'
}

// Error occurred
{
    type: 'error',
    message: 'Error description'
}
```

## Advanced Features

### Multiple Clocks

```html
<div class="clock-grid">
    <div class="clock" data-timezone="UTC">
        <div class="time" id="time-utc">--:--:--</div>
        <div class="label">UTC</div>
    </div>
    <div class="clock" data-timezone="local">
        <div class="time" id="time-local">--:--:--</div>
        <div class="label">Local</div>
    </div>
</div>

<script>
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'time') {
        const time = new Date(data.data.timestamp);
        
        // UTC time
        document.getElementById('time-utc').textContent = 
            time.toLocaleTimeString('en-US', { timeZone: 'UTC' });
            
        // Local time
        document.getElementById('time-local').textContent = 
            time.toLocaleTimeString();
    }
};
</script>
```

### Clock with Milliseconds

```javascript
function updateDisplay(timeData) {
    const time = new Date(timeData.timestamp);
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const ms = time.getMilliseconds().toString().padStart(3, '0');
    
    timeEl.textContent = `${hours}:${minutes}:${seconds}.${ms}`;
}

// Update more frequently for milliseconds
setInterval(requestTime, 100); // Every 100ms
```

### Connection Status Indicator

```css
.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 5px;
}
.connected { background: #28a745; }
.error { background: #dc3545; }
.connecting { background: #ffc107; }
```

```javascript
function updateStatus(status) {
    const indicator = document.querySelector('.status-indicator');
    indicator.className = `status-indicator ${status}`;
}

ws.onopen = () => {
    updateStatus('connected');
    statusEl.textContent = 'Connected';
};

ws.onclose = () => {
    updateStatus('error');
    statusEl.textContent = 'Disconnected';
};
```

## Production Considerations

### Error Handling

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
        setTimeout(connect, 3000 * reconnectAttempts);
    } else {
        statusEl.textContent = 'Connection failed - Please refresh';
    }
};

ws.onopen = () => {
    reconnectAttempts = 0; // Reset on successful connection
};
```

### Secure Connection (WSS)

```javascript
// For HTTPS sites, use secure WebSocket
const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//your-server.com:8080`);
```

### Performance Optimization

```javascript
// Throttle updates when tab is not visible
let updateInterval;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        updateInterval = setInterval(requestTime, 1000);
    }
});
```

Your HTML page now has a real-time, NTP-synchronized clock that automatically stays precise! 🎯
