# 🚀 Quick Start Guide

## Installation

```bash
npm install precise-time-sync
```

## Basic Usage

```javascript
const timeSync = require('precise-time-sync');

// 1. Synchronize
await timeSync.sync();

// 2. Get precise time
console.log(timeSync.timestamp()); // ISO format
console.log(timeSync.now());       // Date object
```

## Auto-Synchronization

```javascript
// Auto sync every 5 minutes
await timeSync.sync();
timeSync.startAutoSync(300000);

// Time stays precise automatically
setInterval(() => {
    console.log('Time:', timeSync.format(null, 'locale'));
}, 1000);
```

## Real-time Web Clock

```javascript
// Start WebSocket server
await timeSync.sync();
timeSync.startWebSocketServer(8080);
timeSync.startAutoSync(60000);

console.log('Clock: http://localhost:8080');
```

Then open `examples-simple/clock.html` in your browser.

## Advanced Configuration

```javascript
// Smooth correction to avoid time jumps
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,   // Max 1s brutal
    correctionRate: 0.1,       // 10% per sync
    maxOffsetThreshold: 5000   // 5s threshold
});
```

## Events

```javascript
timeSync.on('sync', (data) => {
    console.log(`Synchronized with ${data.server}`);
});

timeSync.on('error', (error) => {
    console.error('Error:', error.message);
});
```

That's it! Your application now has access to precise, synchronized time. 🎯
