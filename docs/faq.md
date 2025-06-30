# ❓ Frequently Asked Questions

## Common Questions

### The offset stays constant (e.g. 40ms), is this normal?

**Yes, it's perfect!** A constant offset means your clock is stable. It represents the fixed offset between your PC and the NTP server. As long as it doesn't drift constantly, everything is fine.

### Why use smooth correction?

Without smooth correction, a large offset can create an annoying "time jump" for:
- Logs with timestamps
- Animations 
- Performance measurements

Smooth correction smooths these corrections for fluid time.

### What frequency for auto-sync?

**Recommendations:**
- Normal applications: 5-10 minutes
- Critical applications: 1-2 minutes  
- Simple scripts: no auto-sync needed

### NTP servers don't respond

TimeSync automatically tries multiple servers:
1. pool.ntp.org
2. time.google.com
3. time.cloudflare.com
4. fr.pool.ntp.org

If none work, check your internet connection or firewall.

### How to test precision?

```javascript
const timeSync = require('precise-time-sync');

await timeSync.sync();
const stats = timeSync.stats();

console.log('Offset:', stats.offset, 'ms');
console.log('Last sync:', stats.lastSync);
```

An offset < 100ms is excellent for most uses.

### Can I use my own NTP servers?

```javascript
await timeSync.sync({
    servers: ['your.ntp.server', 'backup.server']
});
```

### Does auto-sync consume many resources?

No, an NTP request is a few bytes. Even with sync every minute, it's negligible.

### How to handle errors?

```javascript
timeSync.on('error', (error) => {
    console.error('Sync error:', error.message);
    // Your fallback logic
});

try {
    await timeSync.sync();
} catch (error) {
    console.error('Unable to synchronize');
}
```

### Does TimeSync work offline?

No, it needs internet to contact NTP servers. Offline, use classic `new Date()`.

### Difference with other libraries?

TimeSync focuses on simplicity:
- Intuitive API (3 lines to start)
- Built-in smooth correction
- Included real-time WebSocket
- Zero configuration by default
