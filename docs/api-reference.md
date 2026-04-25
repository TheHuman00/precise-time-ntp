# API Reference

## Quick navigation

- [Syncing](#syncing) — `sync`, `isSynchronized`
- [Getting the time](#getting-the-time) — `now`, `timestamp`, `offset`
- [Auto-sync](#auto-sync) — `startAutoSync`, `stopAutoSync`
- [Smooth correction](#smooth-correction) — `setSmoothCorrection`, `forceCorrection`
- [WebSocket server](#websocket-server) — `startWebSocketServer`, `stopWebSocketServer`
- [Utilities](#utilities) — `format`, `diff`, `log`, `stats`
- [Events](#events) — `sync`, `error`, `coherenceWarning`, `driftWarning`, `correctionComplete`
- [Full configuration](#full-configuration)

---

## Syncing

### `sync(options?)`

Contacts NTP servers, measures round-trip latency, and calculates the precise clock offset. Must be called at least once before using `now()`.

```javascript
// Minimal — uses default servers and config
await timeSync.sync();

// With options
await timeSync.sync({
    servers: ['time.cloudflare.com', 'time.google.com'],
    timeout: 5000,            // ms — drop a server if it doesn't respond
    coherenceValidation: true // compare servers, use median, warn on outliers
});
```

Throws if all servers fail to respond.

---

### `isSynchronized()`

Returns `true` if at least one successful sync has completed. Does not throw.

```javascript
if (timeSync.isSynchronized()) {
    console.log(timeSync.now());
}
```

---

## Getting the time

### `now()`

Returns the current precise time as a `Date` object, adjusted by the NTP offset.

```javascript
const now = timeSync.now(); // Date — e.g. 2026-04-25T15:30:45.123Z
```

---

### `timestamp()`

Returns the current precise time as an ISO 8601 string.

```javascript
timeSync.timestamp(); // "2026-04-25T15:30:45.123Z"
```

---

### `offset()`

Returns the difference between your system clock and NTP time, in ms. Positive means your system is ahead, negative means it's behind.

```javascript
timeSync.offset(); // e.g. -1250 — system is 1.25s behind
```

---

## Auto-sync

### `startAutoSync(interval)`

Re-syncs on a repeating interval. Prevents drift from accumulating over long-running processes.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `interval` | number | `300000` | ms between syncs |

```javascript
timeSync.startAutoSync(300000); // ms — every 5 minutes
timeSync.startAutoSync(60000);  // ms — every minute, for high-precision apps
```

Computer clocks drift roughly 1–2 seconds per day. For anything running longer than a few minutes, auto-sync is worth enabling.

---

### `stopAutoSync()`

Stops the auto-sync timer.

```javascript
timeSync.stopAutoSync();
```

---

## Smooth correction

### `setSmoothCorrection(enabled, options?)`

Controls how the library applies a new offset after re-syncing. Without it, a large offset is applied instantly — which can break timers and create gaps in logs.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxCorrectionJump` | number (ms) | `1000` | Apply instantly if the diff is under this |
| `correctionRate` | number (0–1) | `0.1` | Fraction of remaining diff to apply each cycle |
| `maxOffsetThreshold` | number (ms) | `5000` | Always apply instantly if diff exceeds this |

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,  // ms — small diffs are applied instantly
    correctionRate: 0.1,      // fraction per sync — fix 10% of the remainder each time
    maxOffsetThreshold: 5000  // ms — very large diffs are also applied instantly
});
```

**Decision logic on re-sync:**
- diff < `maxCorrectionJump` → instant correction (it's small enough)
- diff > `maxOffsetThreshold` → instant correction (it's too large to wait)
- Otherwise → gradual correction at `correctionRate` per sync cycle

→ See [smooth-correction.md](smooth-correction.md) for a detailed walkthrough.

---

### `forceCorrection()`

Skips the gradual process and applies the full pending offset immediately.

```javascript
timeSync.forceCorrection();
```

Useful during shutdown, testing, or when you explicitly want to jump to accurate time right now.

---

## WebSocket server

### `startWebSocketServer(port)`

Starts a WebSocket server that pushes the current NTP time to connected clients. Useful for syncing browser clocks.

```javascript
timeSync.startWebSocketServer(8080);
// clients connect at ws://localhost:8080
```

**Client-side (browser):**
```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (e) => {
    const { data } = JSON.parse(e.data);
    console.log(new Date(data.timestamp));
};
```

---

### `stopWebSocketServer()`

Stops the WebSocket server and closes all connections.

```javascript
timeSync.stopWebSocketServer();
```

---

## Utilities

### `format(date, format, locale?)`

Formats a date into a readable string. Pass `null` as the first argument to format the current NTP time.

| Format value | Output example |
|-------------|----------------|
| `'iso'` | `"2026-04-25T15:30:45.123Z"` |
| `'locale'` | `"25/04/2026, 17:30:45"` (system locale) |
| `'utc'` | `"Sat, 25 Apr 2026 15:30:45 GMT"` |
| `'date'` | `"25/04/2026"` |
| `'time'` | `"17:30:45"` |
| `'timestamp'` | `"1745598645123"` (Unix ms as string) |

```javascript
// Current NTP time
timeSync.format(null, 'iso')
timeSync.format(null, 'locale')
timeSync.format(null, 'locale', 'en-US') // override locale

// A specific date
timeSync.format('2026-01-01', 'iso')
timeSync.format(new Date(), 'utc')
```

`locale` defaults to the system locale, or the `locale` set in the constructor.

---

### `diff(date1, date2?)`

Returns the absolute difference between two dates in ms. If `date2` is omitted, it compares against the current NTP time.

```javascript
timeSync.diff('2026-01-01', '2026-04-25') // ms between two dates
timeSync.diff('2026-01-01')               // ms between that date and now
```

---

### `log(message)`

Logs a message to the console with the current NTP timestamp prepended.

```javascript
timeSync.log('order dispatched');
// → [2026-04-25T15:30:45.123Z] order dispatched
```

---

### `stats()`

Returns a snapshot of the current sync state. Useful for health checks and monitoring dashboards.

```javascript
const s = timeSync.stats();
```

| Field | Type | Description |
|-------|------|-------------|
| `synchronized` | boolean | Whether sync has completed at least once |
| `offset` | number (ms) | Raw system clock error from NTP |
| `rtt` | number (ms) | Last measured network round-trip time |
| `correctedOffset` | number (ms) | Offset currently being applied (smooth correction) |
| `targetOffset` | number (ms) | Final target offset for smooth correction |
| `correctionInProgress` | boolean | Whether gradual correction is still running |
| `lastSync` | Date | When the last sync completed |
| `uptime` | number (ms) | Time elapsed since last sync |
| `config` | object | Active configuration values |

---

## Events

### `sync`

Fires after each successful sync.

```javascript
timeSync.on('sync', (data) => {
    // data.server  — hostname that was used
    // data.offset  — ms — raw clock error
    // data.rtt     — ms — network round-trip time
    console.log(`synced with ${data.server} — offset: ${data.offset}ms, rtt: ${data.rtt}ms`);
});
```

---

### `error`

Fires when a sync attempt fails (all servers unreachable, timeout, etc.).

```javascript
timeSync.on('error', (err) => {
    // err.message — what went wrong
    // err.server  — which server failed
    console.error(`sync failed on ${err.server}: ${err.message}`);
});
```

---

### `coherenceWarning`

Fires when `coherenceValidation` is enabled and servers disagree by more than 100ms. The library uses the median offset and continues, but you may want to alert on this.

```javascript
timeSync.on('coherenceWarning', (data) => {
    // data.variance — ms — spread between server offsets
    // data.servers  — array of server results
    console.warn(`server variance: ${data.variance}ms`);
});
```

---

### `driftWarning`

Fires when `now()` is called more than 1 hour after the last sync. Your offset may be stale.

```javascript
timeSync.on('driftWarning', (data) => {
    // data.elapsed — ms since last sync
    const hours = (data.elapsed / 3600000).toFixed(1);
    console.warn(`${hours}h since last sync — consider re-syncing`);
});
```

---

### `correctionComplete`

Fires when smooth correction finishes (converged, timed out, or forced).

```javascript
timeSync.on('correctionComplete', (data) => {
    // data.finalOffset — ms — where correction landed
    // data.converged   — boolean — true if within 0.5ms of target
    // data.forced      — boolean — true if forceCorrection() was called
    // data.timeout     — boolean — true if correction timed out (30s max)
    console.log(`correction done — final offset: ${data.finalOffset}ms`);
});
```

---

## Full configuration

All options can be passed to `sync()` or set in the `TimeSync` constructor.

```javascript
const { TimeSync } = require('precise-time-ntp');

const t = new TimeSync({
    // NTP servers — up to 3 are queried
    servers: ['time.cloudflare.com', 'time.google.com', 'pool.ntp.org'],

    timeout: 5000,             // ms — per-server timeout
    coherenceValidation: true, // cross-validate servers, use median

    autoSync: true,
    autoSyncInterval: 300000,  // ms — how often to re-sync

    smoothCorrection: true,
    maxCorrectionJump: 1000,   // ms
    correctionRate: 0.1,       // fraction per sync (0.1 = 10%)
    maxOffsetThreshold: 5000,  // ms

    locale: 'fr-FR',           // used by format() — defaults to system locale
});
```
