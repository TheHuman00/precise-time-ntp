# Quick Start

## Install

```bash
npm install precise-time-ntp
```

---

## Your first sync

```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();

console.log(timeSync.now());       // Date object — precise NTP time
console.log(timeSync.timestamp()); // ISO string — "2026-04-25T15:30:45.123Z"
console.log(timeSync.offset());    // ms — how far off your system clock is
```

`sync()` contacts up to 3 NTP servers, measures round-trip latency, and calculates the real offset. After that, `now()` always returns corrected time — `Date.now()` under the hood, adjusted.

---

## Keep it synced automatically

A single sync is fine for short scripts. For anything that runs more than a few minutes, clocks drift — so re-sync periodically:

```javascript
await timeSync.sync();
timeSync.startAutoSync(300000); // ms — every 5 minutes

// From here, timeSync.now() stays accurate without any extra work
```

---

## Use multiple servers for reliability

By default the library already queries 3 servers. You can customize which ones, how long to wait, and whether to cross-validate results:

```javascript
await timeSync.sync({
    servers: ['time.cloudflare.com', 'time.google.com', 'pool.ntp.org'],
    timeout: 5000,            // ms — drop a server if it doesn't respond in time
    coherenceValidation: true // compare servers and use the median — catches bad actors
});
```

`coherenceValidation` is worth enabling in production. If one server returns a weird offset, the library will emit a `coherenceWarning` and use the median instead of trusting the outlier.

---

## Production setup

Here's a config that's safe for real workloads — gradual correction prevents time jumps from breaking your timers and logs:

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 500,  // ms — apply instantly if the diff is small
    correctionRate: 0.1,     // fraction per sync — fix 10% at a time if it's large
    maxOffsetThreshold: 3000 // ms — force instant correction if offset is way off
});

await timeSync.sync({ coherenceValidation: true });
timeSync.startAutoSync(300000); // ms
```

Without smooth correction, re-syncing when you're 2 seconds off means your app clock jumps 2 seconds forward instantly. That breaks `setTimeout`, messes up performance measurements, and creates weird log gaps. Smooth correction fixes the drift gradually instead.

→ Full explanation: [Smooth Correction](smooth-correction.md)

---

## Listen to what's happening

The library emits events so you can monitor sync health without polling:

```javascript
timeSync.on('sync', (data) => {
    console.log(`synced with ${data.server} — offset: ${data.offset}ms, rtt: ${data.rtt}ms`);
});

timeSync.on('error', (err) => {
    console.error(`sync failed on ${err.server}: ${err.message}`);
});

timeSync.on('coherenceWarning', (data) => {
    // servers disagree by more than 100ms
    console.warn(`server variance: ${data.variance}ms`);
});
```

These are especially useful in production to catch servers that start drifting or become unreachable.

---

## Live clock in the browser

Serve NTP time to any connected browser over WebSocket:

**server.js**
```javascript
await timeSync.sync();
timeSync.startWebSocketServer(8080);
timeSync.startAutoSync(300000); // ms
```

**index.html**
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

The server pushes the current NTP time on every connection. The client just parses and renders — no NTP logic needed in the browser.

---

## What's next

- [API Reference](api-reference.md) — every method, option, and return value
- [WebSocket Guide](websocket-guide.md) — deeper dive into the browser integration
- [Smooth Correction](smooth-correction.md) — how gradual correction works under the hood
- [FAQ](faq.md) — why is my offset constant? why did sync fail? and more
