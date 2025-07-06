# ⏰ precise-time-ntp

**The ultimate time synchronization library for Node.js applications**

<div align="center">

[![npm version](https://img.shields.io/npm/v/precise-time-ntp?style=for-the-badge&color=brightgreen&label=npm)](https://www.npmjs.com/package/precise-time-ntp)
[![Node.js](https://img.shields.io/badge/Node.js-≥14.0.0-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-precise--time--ntp-black?style=for-the-badge&logo=github)](https://github.com/TheHuman00/precise-time-ntp)

**🚀 Sync with atomic clocks • Smooth correction • Server validation**

</div>

---

## 🎯 What makes precise-time-ntp special?

✅ **Atomic Precision** - Sync with global NTP servers  
✅ **Smart System Drift Correction** - Automatically compensates for clock drift over time  
✅ **Network Latency Compensation** - Accounts for network delays in time calculations  
✅ **Server Coherence Validation** - Validates consistency across multiple NTP servers  
✅ **Smooth Time Correction** - Prevents jarring time jumps in applications  
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

## Advanced Features

### Server Validation
Automatically test multiple NTP servers for better reliability:

```javascript
// Enable server validation (detects unreliable/inaccurate servers)
await timeSync.sync({ coherenceValidation: true });
```

### Smooth Time Correction
Prevent jarring time jumps in your applications:

```javascript
// Gradually adjust time instead of instant jumps (prevents breaking timers)
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,     // Max 1s instant jump (larger = gradual)
    correctionRate: 0.1,         // 10% gradual correction per sync cycle
    maxOffsetThreshold: 5000     // Force instant correction if >5s off (emergency)
});

await timeSync.sync({ coherenceValidation: true });
timeSync.startAutoSync(300000);
```

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

// Custom configuration with server validation
await timeSync.sync({
    servers: ['time.cloudflare.com', 'time.google.com'],  // Custom NTP servers
    timeout: 5000,                                        // 5s timeout per server
    retries: 3,                                           // Retry 3 times if failed
    coherenceValidation: true  // Tests multiple servers for consistency (detects bad servers)
});

console.log('Synced with validated servers!');
```

### 3. Auto-Sync & Production Setup
```javascript
const timeSync = require('precise-time-ntp');

// Basic auto-sync setup
await timeSync.sync({ 
    coherenceValidation: true  // Validate server consistency (recommended)
});
timeSync.startAutoSync(300000); // Re-sync every 5 minutes

// Production setup with smooth correction
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 500,      // Max 0.5s instant jump (prevents app disruption)
    correctionRate: 0.1,         // 10% gradual correction per sync
    maxOffsetThreshold: 3000     // Force instant correction if >3s off
});

await timeSync.sync({ coherenceValidation: true });
timeSync.startAutoSync(300000);

console.log('Production time sync active!');
// Your computer's clock drifts ~1-2 seconds per day without auto-sync
```

### 4. Smooth Time Correction (Avoid Time Jumps)
```javascript
const timeSync = require('precise-time-ntp');

// Configure smooth correction to prevent breaking running timers/intervals
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,     // Max 1s instant jump (larger jumps are gradual)
    correctionRate: 0.1,         // 10% gradual correction per sync cycle
    maxOffsetThreshold: 5000     // Force instant correction if >5s off (emergency)
});

await timeSync.sync({ 
    coherenceValidation: true    // Validate server consistency for accuracy
});
timeSync.startAutoSync(300000);

// Monitor when correction completes
timeSync.on('correctionComplete', (data) => {
    console.log(`🎯 Correction completed: ${data.finalOffset}ms`);
    if (data.converged) console.log('Perfect precision achieved');
});
```

### 5. Live HTML Clock
```javascript
// Node.js server
const timeSync = require('precise-time-ntp');

await timeSync.sync({ 
    coherenceValidation: true    // Ensure accurate time for public display
});
timeSync.startWebSocketServer(8080);  // Broadcast time to web clients
timeSync.startAutoSync(300000);       // Keep time accurate automatically
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

await timeSync.sync({ 
    coherenceValidation: true    // Enable server validation events
});

// Basic sync events
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
| `stats()` | Get detailed sync info | `timeSync.stats()` |
| `startAutoSync(ms)` | Auto-sync every X ms | `timeSync.startAutoSync(300000)` |
| `stopAutoSync()` | Stop auto-sync | `timeSync.stopAutoSync()` |
| `setSmoothCorrection()` | Configure gradual time correction | `timeSync.setSmoothCorrection(true, options)` |
| `startWebSocketServer(port)` | Enable HTML integration | `timeSync.startWebSocketServer(8080)` |

---

## 🔍 System Monitoring & Diagnostics

For advanced monitoring and diagnostics in production environments:

### Get Detailed Stats
Monitor synchronization status and performance:

```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();

// Get detailed synchronization information
const stats = timeSync.stats();
console.log(stats);

/* Output:
{
  synchronized: true,              // Sync status
  lastSync: 2025-07-06T19:18:27.130Z,  // Last sync time
  offset: -10,                     // Real system offset (ms)
  correctedOffset: -10,            // Currently applied offset (ms)
  targetOffset: -10,               // Target for smooth correction (ms)
  correctionInProgress: false,     // Whether correction is active
  uptime: 5432,                    // Time since sync (ms)
  config: {                        // Current configuration
    smoothCorrection: true,
    maxCorrectionJump: 1000,
    correctionRate: 0.1,
    maxOffsetThreshold: 5000
  }
}
*/

// Access specific values
console.log('System offset:', stats.offset, 'ms');
console.log('Is synchronized:', stats.synchronized);
console.log('Smooth correction active:', stats.correctionInProgress);
```

### Server Monitoring
Monitor server coherence and detect inconsistencies:

```javascript
// Monitor for server issues
timeSync.on('coherenceWarning', (data) => {
    console.log(`⚠️ Server variance detected: ${data.variance}ms`);
    console.log('Servers tested:', data.servers);
});
```

### System Health Monitoring
Monitor system clock drift and correction progress:

```javascript
// Monitor system clock drift
timeSync.on('driftWarning', (data) => {
    const hours = (data.elapsed / 3600000).toFixed(1);
    console.log(`⏰ System running ${hours}h without sync`);
});

// Monitor smooth correction completion
timeSync.on('correctionComplete', (data) => {
    console.log(`🎯 Correction completed: ${data.finalOffset}ms`);
    if (data.converged) console.log('Perfect convergence achieved');
});
```

---

## 📄 Complete Documentation

For detailed guides, advanced configuration, and troubleshooting:

**👉 [View Full Documentation](docs/)**

- [Quick Start Guide](docs/quick-start.md) - Get started in 5 minutes
- [Complete API Reference](docs/api-reference.md) - All methods and options  
- [WebSocket Integration](docs/websocket-guide.md) - Real-time HTML clocks

**📁 Examples:**
- `examples/basic.js` - Simple time sync with stats
- `examples/auto-sync.js` - Automatic periodic synchronization  
- `examples/monitoring.js` - Detailed synchronization diagnostics
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
