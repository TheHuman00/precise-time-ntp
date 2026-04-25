# FAQ

## My offset is always the same value — is something broken?

No, that's normal. The offset is the fixed difference between your system clock and the NTP server. If your machine is consistently 42ms behind, the offset will always read 42ms. A *stable* offset is a sign the library is working correctly.

It would only be a problem if the offset were constantly growing (your clock is drifting faster than expected) or jumping around erratically (unreliable NTP server or network).

---

## `now()` vs `timestamp()` — which should I use?

- `now()` returns a `Date` object. Use it when you need to do date math, compare times, or pass it to something that expects a `Date`.
- `timestamp()` returns an ISO 8601 string. Use it for logs, HTTP headers, JSON payloads.

```javascript
timeSync.now()        // Date object — good for calculations
timeSync.timestamp()  // "2026-04-25T15:30:45.123Z" — good for strings
```

---

## How often should I call `startAutoSync`?

It depends on how much drift matters in your app:

| Use case | Recommended interval |
|----------|----------------------|
| General apps | 5–10 min (`300000`–`600000` ms) |
| Logs or audit trails | 1–2 min (`60000`–`120000` ms) |
| Short scripts | No auto-sync needed — one `sync()` is enough |

```javascript
timeSync.startAutoSync(300000); // ms — every 5 minutes
```

---

## Can I use my own NTP servers?

Yes. Pass them as an array — the library will query up to 3 and use the best result.

```javascript
await timeSync.sync({
    servers: ['time.cloudflare.com', 'your.internal.ntp.server']
});
```

Corporate networks sometimes block external NTP. If you're getting timeouts in a restricted environment, try your internal NTP server address.

---

## Sync is failing / all servers timeout

First, check if port 123 (UDP) is open. NTP uses UDP 123 — some firewalls or cloud environments block it by default.

Then try different servers explicitly:

```javascript
await timeSync.sync({
    servers: ['time.nist.gov', 'time.windows.com'],
    timeout: 8000 // ms — give them more time
});
```

If you're on a VPN or proxy, NTP may not route correctly through it. Try disabling it temporarily to test.

---

## Does this work offline?

No — it needs to reach at least one NTP server. If you're offline, `sync()` will throw. You can catch that and fall back to `Date.now()`:

```javascript
try {
    await timeSync.sync();
} catch (err) {
    console.warn('NTP unavailable, using system clock');
}

// timeSync.now() still works — it just returns uncorrected system time
```

---

## What's `coherenceValidation` and should I enable it?

When enabled, the library queries multiple servers and compares their offsets. If one server is an outlier, it's discarded and the median is used. A `coherenceWarning` event fires if the variance between servers exceeds 100ms.

Enable it in production. The overhead is minimal (a few extra UDP packets) and it protects you from a misconfigured server sending wrong time.

```javascript
await timeSync.sync({ coherenceValidation: true });

timeSync.on('coherenceWarning', (data) => {
    console.warn(`servers disagree by ${data.variance}ms`);
});
```

---

## Why use smooth correction?

Without it, if your clock is 2 seconds off and you re-sync, the library corrects it instantly — jumping 2 seconds forward. That breaks `setTimeout`, `setInterval`, performance measurements, and log ordering.

Smooth correction applies the fix gradually (e.g. 10% per sync cycle) so the adjustment is invisible to your app. If the offset is small or huge, it still handles those edge cases separately via `maxCorrectionJump` and `maxOffsetThreshold`.

→ Full explanation: [smooth-correction.md](smooth-correction.md)

---

## How do I check if the library has synced at least once?

```javascript
if (timeSync.isSynchronized()) {
    console.log(timeSync.now());
} else {
    console.warn('not yet synced');
}
```

`isSynchronized()` returns `false` until the first successful `sync()` completes. Useful for conditional logic at startup.

---

## Auto-sync on resources — is it heavy?

Not at all. An NTP packet is 48 bytes. Even syncing every minute, the total bandwidth over a day is under 200KB. CPU impact is negligible — it's a single UDP request.
