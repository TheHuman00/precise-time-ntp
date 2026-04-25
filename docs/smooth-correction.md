# Smooth Correction

## The problem it solves

Your app has been running for 20 minutes. Auto-sync fires. The NTP server says your clock is 2 seconds behind. Without smooth correction, the library corrects it instantly — your app clock jumps forward 2 full seconds.

That causes real problems:

- `setTimeout` and `setInterval` callbacks fire at unexpected times
- Performance benchmarks show negative durations
- Log timestamps have a 2-second gap or overlap
- Animations stutter or skip
- Any code that compares `Date.now()` before and after an operation breaks

Smooth correction fixes this by applying the offset gradually over multiple sync cycles instead of all at once.

---

## How the decision is made

On every re-sync, the library looks at the new offset and decides how to apply it:

```
new offset < maxCorrectionJump  →  apply instantly (it's small, no impact)
new offset > maxOffsetThreshold →  apply instantly (it's huge, waiting is worse)
anything in between             →  apply gradually at correctionRate per cycle
```

With defaults (`maxCorrectionJump: 1000ms`, `maxOffsetThreshold: 5000ms`, `correctionRate: 0.1`):

- Offset of 200ms → instant (under 1s threshold)
- Offset of 2500ms → gradual: 2500 → 2250 → 2025 → 1822 → ... until < 0.5ms
- Offset of 8000ms → instant (over 5s threshold, too large to wait)

The gradual path converges to within 0.5ms, then emits `correctionComplete`.

---

## Setup

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,  // ms — apply instantly if diff is under this
    correctionRate: 0.1,      // fraction per sync — fix 10% of the remainder each cycle
    maxOffsetThreshold: 5000  // ms — apply instantly if diff exceeds this
});

await timeSync.sync();
timeSync.startAutoSync(300000); // ms
```

Smooth correction is enabled by default. You only need to call `setSmoothCorrection` if you want to tune the parameters.

---

## Presets by use case

```javascript
// Logging systems — prioritize smooth timestamps, tolerate slow correction
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 500,   // ms
    correctionRate: 0.05,     // 5% per cycle — slow and steady
    maxOffsetThreshold: 10000 // ms — high tolerance before forcing
});

// Real-time apps — balanced
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,  // ms
    correctionRate: 0.1,      // 10% per cycle
    maxOffsetThreshold: 5000  // ms
});

// Performance measurements — correct fast, tolerate moderate jumps
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 2000,  // ms — larger jumps are fine here
    correctionRate: 0.2,      // 20% per cycle — faster convergence
    maxOffsetThreshold: 3000  // ms
});
```

---

## Monitoring correction

```javascript
timeSync.on('correctionComplete', (data) => {
    // data.finalOffset — ms — where it landed
    // data.converged   — true if within 0.5ms of target
    // data.forced      — true if forceCorrection() was called
    // data.timeout     — true if correction hit the 30s safety limit
    console.log(`correction done — final offset: ${data.finalOffset}ms`);
});
```

To see what's happening mid-correction, check stats:

```javascript
const s = timeSync.stats();
console.log(`raw offset: ${s.offset}ms, applied: ${s.correctedOffset}ms, converged: ${!s.correctionInProgress}`);
```

---

## Force or disable

```javascript
// Can't wait for gradual correction — apply everything now
timeSync.forceCorrection();

// Turn off smooth correction entirely
timeSync.setSmoothCorrection(false);
```

---

## When NOT to use it

Skip smooth correction if:

- Your script runs for a few seconds and exits — drift won't accumulate
- You sync very frequently (every 30s or less) — offsets stay small, jumps are negligible
- Your app explicitly needs the most accurate time at every `now()` call and doesn't care about continuity

For everything else — long-running processes, servers, real-time UIs, anything with logs — leave it on.
