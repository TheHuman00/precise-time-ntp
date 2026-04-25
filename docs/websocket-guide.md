# WebSocket Guide

The library includes a built-in WebSocket server that pushes NTP-accurate time to any connected browser. No NTP logic in the client — the server does all the work.

---

## Minimal setup

**server.js**
```javascript
const timeSync = require('precise-time-ntp');

await timeSync.sync();
timeSync.startWebSocketServer(8080);
timeSync.startAutoSync(300000); // ms — keep the server accurate
```

**index.html**
```html
<div id="clock"></div>
<script>
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (e) => {
        const { data } = JSON.parse(e.data);
        document.getElementById('clock').textContent =
            new Date(data.timestamp).toLocaleTimeString();
    };

    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ type: 'getTime' }));
    }, 1000);
</script>
```

```bash
node server.js
# then open index.html in your browser
```

---

## Protocol

### Client → Server

```javascript
{ "type": "getTime" }  // request the current NTP time
{ "type": "sync" }     // trigger a server re-sync
```

### Server → Client

```javascript
// response to getTime
{
    "type": "time",
    "data": {
        "timestamp": "2026-04-25T15:30:45.123Z",
        "offset": -42,       // ms — server's current clock error
        "synchronized": true
    }
}

// after a sync triggered by the client
{ "type": "syncComplete", "message": "Synchronization completed" }

// on error
{ "type": "error", "message": "Synchronization failed" }
```

---

## Useful client patterns

### Display milliseconds

```javascript
function updateDisplay(timestamp) {
    const t = new Date(timestamp);
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    const ss = String(t.getSeconds()).padStart(2, '0');
    const ms = String(t.getMilliseconds()).padStart(3, '0');
    document.getElementById('clock').textContent = `${hh}:${mm}:${ss}.${ms}`;
}

// poll more frequently for smooth milliseconds display
setInterval(() => ws.send(JSON.stringify({ type: 'getTime' })), 100);
```

### Multiple time zones

```javascript
ws.onmessage = (e) => {
    const { data } = JSON.parse(e.data);
    const t = new Date(data.timestamp);

    document.getElementById('utc').textContent =
        t.toLocaleTimeString('en-US', { timeZone: 'UTC' });

    document.getElementById('paris').textContent =
        t.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' });

    document.getElementById('ny').textContent =
        t.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
};
```

### Auto-reconnect

```javascript
let reconnectDelay = 1000;

function connect() {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => { reconnectDelay = 1000; }; // reset on success

    ws.onclose = () => {
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000); // cap at 30s
    };

    ws.onmessage = (e) => { /* ... */ };
}

connect();
```

### Pause updates when tab is hidden

```javascript
let interval;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(interval);
    } else {
        interval = setInterval(() => ws.send(JSON.stringify({ type: 'getTime' })), 1000);
    }
});
```

### Use `wss://` on HTTPS

```javascript
const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//your-server.com:8080`);
```

---

## Troubleshooting

**Connection refused** — check that `server.js` is running and port 8080 is not blocked (`netstat -an | grep 8080`).

**Time not updating** — open browser dev tools → Network → WS tab and check if messages are being received.

**Wrong time** — the server's system clock may be very far off. Check `timeSync.offset()` on the server after sync. Enable smooth correction if the offset is large.

**`wss://` fails** — you need a valid TLS certificate on the server. Self-signed certs are rejected by browsers for WebSocket connections too.
