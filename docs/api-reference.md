# 📖 API Reference

## Core Methods

### `sync(options)`
Synchronizes with NTP servers.

```javascript
await timeSync.sync({
    servers: ['pool.ntp.org', 'time.google.com'],
    timeout: 5000,
    retries: 3
});
```

### `now()`
Returns current precise time.

```javascript
const preciseTime = timeSync.now(); // Date object
```

### `timestamp()`
Returns time in ISO format.

```javascript
const iso = timeSync.timestamp(); // "2024-12-30T15:30:45.123Z"
```

### `offset()`
Returns system offset in milliseconds.

```javascript
const offset = timeSync.offset(); // 42 (ms)
```

### `isSynchronized()`
Checks if clock is synchronized.

```javascript
if (timeSync.isSynchronized()) {
    console.log('Clock synchronized');
}
```

## Auto-Synchronization

### `startAutoSync(interval)`
Starts automatic synchronization.

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
