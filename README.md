# precise-time-ntp

<div align="center">

[![npm version](https://img.shields.io/npm/v/precise-time-ntp?style=for-the-badge&color=brightgreen&label=npm)](https://www.npmjs.com/package/precise-time-ntp)
[![Node.js](https://img.shields.io/badge/Node.js-≥14.0.0-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-precise--time--ntp-black?style=for-the-badge&logo=github)](https://github.com/TheHuman00/precise-time-ntp)

</div>

Sync your Node.js app with NTP servers and get the real time — not whatever your system clock thinks it is.

Your system clock drifts. Servers disagree. `Date.now()` lies. This library fixes that with a proper 4-timestamp NTP implementation that compensates for network latency, validates server consistency, and corrects drift gradually without breaking your running timers.

---

## Install

```bash
npm install precise-time-ntp
```

---

## Quick start

```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();

timeSync.now()        // Date object — precise NTP time
timeSync.timestamp()  // "2026-04-25T15:30:45.123Z"
timeSync.offset()     // how far off your system clock is, in ms
```

---

## Configuration

All options can be set at construction time or overridden per `sync()` call.

```javascript
const { TimeSync } = require('precise-time-ntp');

const t = new TimeSync({
    // NTP servers to query (up to 3 are used for coherence validation)
    servers: ['time.cloudflare.com', 'time.google.com', 'pool.ntp.org'],

    timeout: 5000,             // ms before a server is considered unreachable
    coherenceValidation: true, // compare servers and use median offset

    // Auto-sync on startup
    autoSync: true,
    autoSyncInterval: 300000,  // re-sync every 5 minutes

    // Smooth correction (see section below)
    smoothCorrection: true,
    maxCorrectionJump: 1000,
    correctionRate: 0.1,
    maxOffsetThreshold: 5000,

    locale: 'fr-FR',           // used by format() — defaults to system locale
});
```

Or pass options directly to `sync()` for a one-off override:

```javascript
await timeSync.sync({
    servers: ['time.cloudflare.com'],
    timeout: 3000,
    coherenceValidation: false,
});
```

The default global instance uses `pool.ntp.org`, `time.google.com`, and `time.cloudflare.com`.

---

## Keep it synced automatically

```javascript
await timeSync.sync();
timeSync.startAutoSync(300000); // re-sync every 5 minutes
```

Or enable it at construction: `new TimeSync({ autoSync: true, autoSyncInterval: 300000 })`.

`coherenceValidation` queries multiple servers and uses the median offset — useful if one server is having a bad day. Emits a `coherenceWarning` event if servers disagree by more than 100ms.

---

## Smooth correction

By default, if your clock is off by 500ms and you re-sync, it jumps 500ms instantly. That can break timers and logs. Smooth correction applies the fix gradually:

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,  // apply instantly if diff is under 1s
    correctionRate: 0.1,      // otherwise, fix 10% per sync cycle
    maxOffsetThreshold: 5000  // always apply instantly if diff > 5s
});

// If you can't wait for the gradual correction to finish:
timeSync.forceCorrection();
```

---

## Utilities

```javascript
// Format a date
timeSync.format(null, 'iso')              // "2026-04-25T15:30:45.123Z"
timeSync.format(null, 'locale')           // system locale, e.g. "25/04/2026, 17:30:45"
timeSync.format(null, 'locale', 'en-US') // "4/25/2026, 5:30:45 PM"
timeSync.format(null, 'utc')             // "Sat, 25 Apr 2026 15:30:45 GMT"
timeSync.format(null, 'date')            // date only
timeSync.format(null, 'time')            // time only
timeSync.format(null, 'timestamp')       // Unix timestamp as string

// Difference between two dates (ms)
timeSync.diff('2026-01-01', timeSync.now()) // e.g. 9849600000

// console.log with NTP timestamp prefix
timeSync.log('order processed')
// → [2026-04-25T15:30:45.123Z] order processed

// Check sync status without throwing
if (timeSync.isSynchronized()) {
    console.log(timeSync.now());
}
```

---

## Live HTML clock via WebSocket

```javascript
// server.js
await timeSync.sync();
timeSync.startWebSocketServer(8080);
timeSync.startAutoSync(300000);
```

```html
<h1 id="clock"></h1>
<script>
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (e) => {
    const { data } = JSON.parse(e.data);
    document.getElementById('clock').textContent =
        new Date(data.timestamp).toLocaleTimeString();
};
</script>
```

---

## Events

```javascript
timeSync.on('sync', (data) => {
    // data.server, data.offset (ms), data.rtt (ms)
    console.log(`synced — offset: ${data.offset}ms, rtt: ${data.rtt}ms`);
});

timeSync.on('error', (err) => {
    // err.message, err.server
    console.error(`sync failed on ${err.server}: ${err.message}`);
});

timeSync.on('coherenceWarning', (data) => {
    // servers disagree by more than 100ms
    console.warn(`server variance: ${data.variance}ms`, data.servers);
});

timeSync.on('driftWarning', (data) => {
    // now() called more than 1 hour after last sync
    console.warn(`${(data.elapsed / 3600000).toFixed(1)}h since last sync`);
});

timeSync.on('correctionComplete', (data) => {
    // data.finalOffset, data.converged, data.forced, data.timeout
    console.log(`correction done — final offset: ${data.finalOffset}ms`);
});
```

---

## Stats

```javascript
const s = timeSync.stats();

s.synchronized         // true/false
s.offset               // current system clock error (ms)
s.rtt                  // last network round-trip time (ms)
s.correctedOffset      // offset currently being applied
s.correctionInProgress // true while smooth correction is running
s.lastSync             // Date of last successful sync
s.uptime               // ms since last sync
```

---

## API

| Method | Description |
|--------|-------------|
| `sync(options?)` | Sync with NTP servers |
| `now()` | Current precise time as a `Date` |
| `timestamp()` | Current time as ISO string |
| `offset()` | System clock error in ms |
| `isSynchronized()` | Returns `true` if synced (no throw) |
| `stats()` | Full sync diagnostics |
| `startAutoSync(ms)` | Re-sync on an interval |
| `stopAutoSync()` | Stop auto-sync |
| `setSmoothCorrection(bool, options?)` | Configure gradual correction |
| `forceCorrection()` | Apply pending correction immediately |
| `startWebSocketServer(port)` | Broadcast time over WebSocket |
| `stopWebSocketServer()` | Stop WebSocket server |
| `format(date?, format?, locale?)` | Format a date (`iso`, `locale`, `utc`, `date`, `time`, `timestamp`) |
| `diff(date1, date2?)` | Difference between two dates in ms |
| `log(message)` | `console.log` with NTP timestamp prefix |

Full option reference: [docs/api-reference.md](docs/api-reference.md)

---

## Try it

```bash
npm run basic        # simple sync
npm run auto-sync    # auto-sync loop
npm run websocket    # WebSocket + HTML clock
```

---

## License

MIT
