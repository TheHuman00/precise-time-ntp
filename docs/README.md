# precise-time-ntp — Documentation

Your system clock drifts. By the time you're reading this, it's probably a few hundred milliseconds off. For most apps that doesn't matter — but for logs, financial transactions, real-time sync, or anything where timestamps need to be trusted, it absolutely does.

`precise-time-ntp` fixes that. It queries NTP servers, compensates for network latency, and gives you a `Date` you can actually rely on.

---

## Where to start

**New here?** → [Quick Start](quick-start.md) — syncing in 2 minutes, production config in 5.

**Looking for a specific method?** → [API Reference](api-reference.md) — every option, return value, and event documented.

**Building a live HTML clock?** → [WebSocket Guide](websocket-guide.md) — server + client code, copy-paste ready.

**Smooth correction confusing you?** → [Smooth Correction](smooth-correction.md) — what it is, why it matters, how to tune it.

**Something not working?** → [FAQ](faq.md) — offset not changing, sync failing, common gotchas.

---

## Try it right now

```bash
npm install precise-time-ntp
```

```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();
console.log(timeSync.now());    // precise Date — not your system clock's guess
console.log(timeSync.offset()); // ms — how far off your system was
```

---

## What it's useful for

- **Logging** — timestamps that match across machines and time zones
- **Performance measurement** — benchmarks that aren't skewed by drift
- **Real-time apps** — synchronized clocks in browsers via WebSocket
- **Financial or audit systems** — transactions with verifiable timestamps
- **Distributed systems** — consistent time across nodes without NTP config per server

---

## Run the examples

From your project root:

```bash
npm run basic        # sync and print the time
npm run auto-sync    # keep syncing every 5 minutes
npm run websocket    # start a time server, then open examples/clock.html
```
