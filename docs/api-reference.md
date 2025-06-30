# 📖 API Reference

## Core Methods

### `sync(options?)`
Synchronizes with NTP servers and compensates for network latency.

**Parameters:**
- `options` (Object, optional) - Configuration options

```javascript
// Basic sync with default servers
await timeSync.sync();

// Advanced configuration
await timeSync.sync({
    servers: ['time.cloudflare.com', 'time.google.com'],
    timeout: 5000,      // Timeout per server (ms)
    retries: 3,         // Retry attempts per server
    samples: 4          // Number of samples for accuracy
});
```

**Default NTP Servers:**
- `pool.ntp.org` - Global pool of volunteer time servers
- `time.nist.gov` - US National Institute of Standards  
- `time.cloudflare.com` - Cloudflare's anycast time service

### `now()`
Returns current precise timestamp in milliseconds.

```javascript
const preciseMsTime = timeSync.now(); // 1719754245123
```

### `timestamp()`
Returns current time in ISO 8601 format.

```javascript
const iso = timeSync.timestamp(); // "2025-06-30T14:30:45.123Z"
```

### `offset()`
Returns system clock offset from atomic time in milliseconds.

```javascript
const offset = timeSync.offset(); // -1250 (system is 1.25s behind)
```

**Note:** Positive = system ahead, Negative = system behind

## Auto-Synchronization

### `startAutoSync(interval)`
Starts automatic re-synchronization to prevent clock drift.

```javascript
// Re-sync every 5 minutes (recommended)
timeSync.startAutoSync(300000);

// For high-precision apps, sync more frequently
timeSync.startAutoSync(60000); // Every minute
```

**Why Auto-Sync?** Computer clocks drift ~1-2 seconds per day. Auto-sync keeps your app precisely synchronized.

### `stopAutoSync()`
Stops automatic synchronization.

```javascript
timeSync.stopAutoSync();
```

## Smooth Time Correction

### `setSmoothCorrection(enabled, options?)`
Configures gradual time adjustment to prevent jarring time jumps.

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,     // Max instant correction (ms)
    correctionRate: 0.1,         // Gradual correction rate (0-1)
    maxOffsetThreshold: 5000     // Force instant if offset > this
});
```

**Options:**
- `maxCorrectionJump` - Maximum instant time jump (ms)
- `correctionRate` - How fast to gradually correct (0.1 = 10% per sync)
- `maxOffsetThreshold` - Force instant correction beyond this offset

**Example:** If system is 3s off:
- Without smooth correction: Instant 3s jump ⚡
- With smooth correction: Gradual adjustment over ~30 seconds 🌊

## WebSocket Server

### `startWebSocketServer(port)`
Starts WebSocket server for real-time HTML clocks.

```javascript
// Start WebSocket server
timeSync.startWebSocketServer(8080);

// HTML clients can now connect to ws://localhost:8080
```

### `stopWebSocketServer()`
Stops the WebSocket server.

```javascript
timeSync.stopWebSocketServer();
```

## Events

The library emits events for monitoring synchronization status.

### `sync`
Emitted after successful synchronization.

```javascript
timeSync.on('sync', (data) => {
    console.log(`✅ Synced with ${data.server}`);
    console.log(`Offset: ${data.offset}ms`);
    console.log(`Round-trip: ${data.roundTrip}ms`);
});
```

**Event Data:**
- `server` - NTP server used for sync
- `offset` - Clock offset in milliseconds
- `roundTrip` - Network round-trip time

### `error`
Emitted when synchronization fails.

```javascript
timeSync.on('error', (error) => {
    console.log(`❌ Sync failed: ${error.message}`);
    console.log(`Server: ${error.server}`);
});
```

## Complete Configuration Example

```javascript
const timeSync = require('precise-time-ntp');

// Configure everything at once
await timeSync.sync({
    servers: ['time.cloudflare.com', 'time.google.com'],
    timeout: 5000,
    retries: 3,
    samples: 4
});

// Setup smooth correction
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,
    correctionRate: 0.1,
    maxOffsetThreshold: 5000
});

// Start auto-sync
timeSync.startAutoSync(300000);

// Start WebSocket server for HTML clients
timeSync.startWebSocketServer(8080);

// Listen to events
timeSync.on('sync', (data) => {
    console.log(`Synced with ${data.server}, offset: ${data.offset}ms`);
});

timeSync.on('error', (error) => {
    console.log(`Sync failed: ${error.message}`);
});

console.log('⏰ Precise time system ready!');
```

```javascript
timeSync.startAutoSync(300000); // Every 5 minutes
```

### `stopAutoSync()`
Stops automatic synchronization.

```javascript
timeSync.stopAutoSync();
```

## Smooth Correction

### `setSmoothCorrection(enabled, options)`
Configures smooth correction.

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,    // ms
    correctionRate: 0.1,        // 0-1
    maxOffsetThreshold: 5000    // ms
});
```

### `forceCorrection()`
Forces immediate correction.

```javascript
timeSync.forceCorrection();
```

## WebSocket

### `startWebSocketServer(port)`
Starts WebSocket server for time broadcasting.

```javascript
const port = timeSync.startWebSocketServer(8080);
```

### `stopWebSocketServer()`
Stops WebSocket server.

```javascript
timeSync.stopWebSocketServer();
```

## Utilities

### `format(date, format)`
Formats a date/time.

```javascript
timeSync.format(null, 'locale');     // "12/30/2024, 3:30:45 PM"
timeSync.format(null, 'iso');        // "2024-12-30T15:30:45.123Z"
timeSync.format(null, 'time');       // "3:30:45 PM"
timeSync.format(null, 'date');       // "12/30/2024"
```

### `diff(date1, date2)`
Calculates difference between two dates in milliseconds.

```javascript
const diff = timeSync.diff(date1, date2); // 1500 (ms)
```

### `log(message)`
Displays message with precise timestamp.

```javascript
timeSync.log('Important message'); // [2024-12-30T15:30:45.123Z] Important message
```

### `stats()`
Returns synchronization statistics.

```javascript
const stats = timeSync.stats();
console.log(stats.offset);              // Current offset
console.log(stats.synchronized);        // Sync state
console.log(stats.lastSync);           // Last sync
console.log(stats.correctionInProgress); // Correction in progress
```

## Events

### `sync`
Emitted after each successful synchronization.

```javascript
timeSync.on('sync', (data) => {
    console.log(`Sync with ${data.server}`);
    console.log(`Offset: ${data.offset}ms`);
});
```

### `error`
Emitted on synchronization error.

```javascript
timeSync.on('error', (error) => {
    console.error('Sync error:', error.message);
});
```

### `correctionComplete`
Emitted when smooth correction completes.

```javascript
timeSync.on('correctionComplete', (data) => {
    console.log(`Correction completed: ${data.finalOffset}ms`);
});
```

## Configuration Options

### Default NTP servers
```javascript
[
    "pool.ntp.org",
    "time.google.com", 
    "time.cloudflare.com",
    "fr.pool.ntp.org"
]
```

### Complete configuration
```javascript
await timeSync.sync({
    servers: ['custom.ntp.server'],
    timeout: 10000,           // Timeout per server (ms)
    retries: 5,               // Number of attempts
    autoSync: true,           // Auto-sync after sync
    autoSyncInterval: 600000, // Auto-sync interval (ms)
    smoothCorrection: true,   // Smooth correction
    maxCorrectionJump: 500,   // Max brutal correction (ms)
    correctionRate: 0.05,     // Correction rate (0-1)
    maxOffsetThreshold: 3000  // Brutal correction threshold (ms)
});
```
