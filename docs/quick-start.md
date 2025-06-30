# 🚀 Quick Start Guide

## Installation

```bash
npm install precise-time-ntp
```

## Basic Usage

```javascript
const timeSync = require('precise-time-ntp');

// 1. Synchronize with default NTP servers
await timeSync.sync();

// 2. Get precise time
console.log(timeSync.timestamp()); // ISO format: "2025-06-30T14:30:45.123Z"
console.log(timeSync.now());       // Timestamp in ms: 1719754245123
console.log(timeSync.offset());    // System clock offset: -1250ms
```

## Auto-Synchronization (Recommended)

```javascript
const timeSync = require('precise-time-ntp');

// Initial sync
await timeSync.sync();

// Auto re-sync every 5 minutes (prevents clock drift)
timeSync.startAutoSync(300000);

// Your app now stays synchronized automatically
setInterval(() => {
    console.log('Current time:', timeSync.timestamp());
}, 1000);
```

## Custom NTP Servers

```javascript
const timeSync = require('precise-time-ntp');

// Use specific NTP servers
await timeSync.sync({
    servers: ['time.cloudflare.com', 'time.google.com'],
    timeout: 5000,    // 5s timeout per server
    retries: 3,       // Retry 3 times if failed
    samples: 4        // Take 4 samples for accuracy
});

console.log('Synced with custom servers');
```

## Real-time Web Clock

**Node.js server:**
```javascript
const timeSync = require('precise-time-ntp');

// Start time server
await timeSync.sync();
timeSync.startWebSocketServer(8080);
timeSync.startAutoSync(300000);

console.log('⏰ Time server running at ws://localhost:8080');
```

**HTML page:**
```html
<!DOCTYPE html>
<html>
<head><title>Atomic Clock</title></head>
<body>
    <h1 id="clock" style="font-size: 3rem; text-align: center;">Loading...</h1>
    
    <script>
        const ws = new WebSocket('ws://localhost:8080');
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            document.getElementById('clock').textContent = 
                new Date(data.data.timestamp).toLocaleTimeString();
        };
        setInterval(() => ws.send('{"type":"getTime"}'), 1000);
    </script>
</body>
</html>
```

## Smooth Time Correction

```javascript
const timeSync = require('precise-time-ntp');

// Prevent jarring time jumps (recommended for production)
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,     // Max 1s instant correction
    correctionRate: 0.1,         // 10% gradual correction rate
    maxOffsetThreshold: 5000     // Force instant if >5s off
});

await timeSync.sync();
timeSync.startAutoSync(300000);
```

## Events & Error Handling

```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();

// Listen to sync events
timeSync.on('sync', (data) => {
    console.log(`✅ Synced with ${data.server} (offset: ${data.offset}ms)`);
});

timeSync.on('error', (error) => {
    console.log(`❌ Sync failed: ${error.message}`);
});

timeSync.startAutoSync(300000);
```

## What's Next?

- **[API Reference](api-reference.md)** - Complete method documentation
- **[WebSocket Guide](websocket-guide.md)** - Advanced HTML integration
- **[FAQ](faq.md)** - Common questions and troubleshooting

That's it! Your application now has access to precise, atomic time. 🎯
