# ⏰ precise-time-ntp

**The ultimate time synchronization library for Node.js applications**

<div align="center">

[![npm version](https://img.shields.io/npm/v/precise-time-ntp?style=for-the-badge&color=brightgreen&label=npm)](https://www.npmjs.com/package/precise-time-ntp)
[![Node.js](https://img.shields.io/badge/Node.js-≥14.0.0-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-precise--time--ntp-black?style=for-the-badge&logo=github)](https://github.com/TheHuman00/precise-time-ntp)

**🚀 Sync with atomic clocks • Create live HTML clocks • Handle system drift automatically**

</div>

---

## 🎯 What makes precise-time-ntp special?

✅ **Atomic Precision** - Sync with global NTP servers  
✅ **Smart System Drift Correction** - Automatically compensates for clock drift over time  
✅ **Network Latency Compensation** - Accounts for network delays in time calculations  
✅ **Universal Compatibility** - Works in Node.js backend + HTML frontend  
✅ **Zero Configuration** - Works out of the box with intelligent defaults  
✅ **Production Hardened** - Automatic failover, error handling, reconnection logic  
✅ **Blazing Fast** - Under 50KB, optimized for performance  

---

## ⚡ Quick Start

```bash
npm install precise-time-ntp
```

```javascript
const timeSync = require('precise-time-ntp');

// Sync with atomic time (automatically handles system drift)
await timeSync.sync();

// Get precise time - accurate to the millisecond
console.log('Precise time:', timeSync.now());
console.log('System is off by:', timeSync.offset(), 'ms');

// Keep your app synchronized automatically
timeSync.startAutoSync(300000); // Re-sync every 5 minutes
```

**🎉 That's it!** Your app now uses atomic time with automatic drift correction.

---

## 📖 Usage Examples

### 1. Basic Time Sync
```javascript
const timeSync = require('precise-time-ntp');

// Sync with default NTP servers: pool.ntp.org, time.nist.gov, time.cloudflare.com
await timeSync.sync();

// Get precise time
console.log('Precise time:', timeSync.now());
console.log('ISO timestamp:', timeSync.timestamp());
console.log('System offset:', timeSync.offset(), 'ms');
```

### 2. Sync Configuration
```javascript
const timeSync = require('precise-time-ntp');

// Configure sync behavior
await timeSync.sync({
    servers: ['time.cloudflare.com', 'time.google.com'],  // Custom NTP servers
    timeout: 5000,                                        // 5s timeout per server
    retries: 3,                                          // Retry 3 times if failed
    samples: 4                                           // Take 4 samples for accuracy
});
```

### 3. Auto-Sync (Recommended for Production)
```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();

// Auto re-sync every 5 minutes (re-queries NTP servers to prevent drift)
// Your computer's clock drifts ~1-2 seconds per day without this!
timeSync.startAutoSync(300000);

console.log('Current time:', timeSync.timestamp());
```

### 4. Smooth Time Correction (Avoid Time Jumps)
```javascript
const timeSync = require('precise-time-ntp');

// Gradually adjust time instead of instant jumps (prevents breaking timers)
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,     // Max 1s instant jump
    correctionRate: 0.1,         // 10% gradual correction
    maxOffsetThreshold: 5000     // Force instant if >5s off
});

await timeSync.sync();
timeSync.startAutoSync(300000);
```

### 5. Live HTML Clock
```javascript
// Node.js server
const timeSync = require('precise-time-ntp');

await timeSync.sync();
timeSync.startWebSocketServer(8080);
timeSync.startAutoSync(300000);
```

```html
<!-- HTML file -->
<h1 id="clock">Loading...</h1>
<script>
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    document.getElementById('clock').textContent = 
        new Date(data.data.timestamp).toLocaleTimeString();
};
setInterval(() => ws.send('{"type":"getTime"}'), 1000);
</script>
```

### 6. Events & Error Handling
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
```

---

## 📊 API Reference

| Method | Purpose | Example |
|--------|---------|---------|
| `sync()` | Sync with NTP servers | `await timeSync.sync()` |
| `now()` | Get precise timestamp (ms) | `timeSync.now()` |
| `timestamp()` | Get ISO string | `timeSync.timestamp()` |
| `offset()` | Get system drift (ms) | `timeSync.offset()` |
| `startAutoSync(ms)` | Auto-sync every X ms | `timeSync.startAutoSync(300000)` |
| `stopAutoSync()` | Stop auto-sync | `timeSync.stopAutoSync()` |
| `setSmoothCorrection()` | Configure gradual time correction | `timeSync.setSmoothCorrection(true, options)` |
| `startWebSocketServer(port)` | Enable HTML integration | `timeSync.startWebSocketServer(8080)` |

### Events
```javascript
timeSync.on('sync', (data) => {
    console.log(`Synced with ${data.server}, offset: ${data.offset}ms`);
});

timeSync.on('error', (error) => {
    console.log(`Sync failed: ${error.message}`);
});
```

## 📄 Complete Documentation

For detailed guides, advanced configuration, and troubleshooting:

**👉 [View Full Documentation](docs/)**

- [Quick Start Guide](docs/quick-start.md) - Get started in 5 minutes
- [Complete API Reference](docs/api-reference.md) - All methods and options  
- [WebSocket Integration](docs/websocket-guide.md) - Real-time HTML clocks
- [Smooth Correction Guide](docs/smooth-correction.md) - Avoid time jumps
- [FAQ & Troubleshooting](docs/faq.md) - Common questions

## Test It Now
```bash
npm run basic        # Simple sync test
npm run auto-sync    # Auto-sync test  
npm run websocket    # WebSocket + HTML demo
```

## 📄 License

MIT License - use anywhere, commercially or personally.

---

<div align="center">

**⏰ precise-time-ntp - Because timing matters**

[📖 Documentation](docs/) • [🐛 Report Bug](https://github.com/TheHuman00/precise-time-ntp/issues) • [💡 Request Feature](https://github.com/TheHuman00/precise-time-ntp/issues)

</div>
