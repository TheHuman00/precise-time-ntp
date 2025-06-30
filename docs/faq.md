# ❓ FAQ - Frequently Asked Questions

## Setup & Configuration

### Q: My offset stays constant (e.g. 40ms), is this normal?

**Yes, it's perfect!** A constant offset means your clock is stable and represents the fixed difference between your system and the NTP server. This is exactly what you want - it shows the library is working correctly.

### Q: Can I use my own NTP servers?

```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync({
    servers: ['your.ntp.server', 'backup.server']
});
```

### Q: What frequency should I use for auto-sync?

**Recommendations:**
- Normal applications: **5-10 minutes**
- Critical applications: **1-2 minutes**  
- Simple scripts: **manual sync only**

```javascript
// Auto-sync every 5 minutes
timeSync.startAutoSync({ interval: 5 * 60 * 1000 });
```

## Troubleshooting

### Q: NTP servers don't respond / timeout errors

The library automatically tries multiple servers:
1. `pool.ntp.org`
2. `time.google.com` 
3. `time.cloudflare.com`

If all fail, check your internet connection or firewall settings. You can also try different servers:

```javascript
await timeSync.sync({
    servers: ['time.nist.gov', 'time.windows.com']
});
```

### Q: How do I handle sync errors properly?

```javascript
const timeSync = require('precise-time-ntp');

timeSync.on('error', (error) => {
    console.error('Sync error:', error.message);
    // Your fallback logic here
});

try {
    await timeSync.sync();
    console.log('Sync successful');
} catch (error) {
    console.error('Sync failed:', error.message);
}
```

### Q: Does the library work offline?

No, it requires internet access to contact NTP servers. When offline, fall back to standard `Date.now()` or `new Date()`.

## Performance & Usage

### Q: How can I test the synchronization precision?

```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();
const stats = timeSync.stats();

console.log('Offset:', stats.offset, 'ms');
console.log('Last sync:', stats.lastSync);
console.log('Precision:', stats.precision, 'ms');
```

**Good precision levels:**
- `< 50ms`: Excellent
- `< 100ms`: Very good
- `< 200ms`: Acceptable for most uses

### Q: Does auto-sync consume many resources?

No, NTP requests are tiny (a few bytes). Even syncing every minute has negligible impact on performance or bandwidth.

### Q: Why should I use smooth correction?

Without smooth correction, large time adjustments create jarring "time jumps" that affect:
- Log timestamps
- Animations and timers
- Performance measurements
- User experience

Smooth correction gradually adjusts time for seamless operation.

## Comparison

### Q: How does this differ from other time sync libraries?

**precise-time-ntp** focuses on simplicity and real-world usage:

✅ **Zero configuration** - works out of the box  
✅ **Built-in smooth correction** - no time jumps  
✅ **WebSocket support** - real-time HTML clocks  
✅ **Auto-sync** - set and forget  
✅ **Modern API** - async/await + events
