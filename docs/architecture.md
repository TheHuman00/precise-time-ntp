# Architecture

## Overview

`precise-time-ntp` is a Node.js library. It has no server component of its own — it is embedded in a user's application and communicates outward to NTP servers and optionally inward to WebSocket clients.

## Actors

| Actor | Description |
|-------|-------------|
| **Application** | The Node.js process that embeds this library. Calls the API and consumes the results. |
| **NTP Servers** | External time servers (e.g. `pool.ntp.org`, `time.google.com`, `time.cloudflare.com`). Respond to UDP packets on port 123. |
| **WebSocket Clients** | Optional. Browser or other clients that connect to the built-in WebSocket server to receive NTP-synchronized timestamps in real time. |

## Actions and Data Flows

### 1. Time Synchronization (`sync`)

```
Application
    │
    ├─ sync() ──────────────────────────────────► NTP Server (UDP :123)
    │                                                     │
    │   t1 = send time                                    │
    │   t2 = server receive time (in response)            │
    │   t3 = server transmit time (in response)           │
    │   t4 = local receive time                           │
    │                                             ◄───────┘
    │   offset = ((t2-t1) + (t3-t4)) / 2
    │   rtt    = (t4-t1) - (t3-t2)
    │
    └─ emits 'sync' event with { server, offset, rtt }
```

Multiple servers are queried in parallel. If `coherenceValidation` is enabled, the median offset is used and a `coherenceWarning` is emitted if servers disagree by more than 100 ms.

### 2. Getting the Time (`now`, `timestamp`, `offset`)

```
Application ──► now() ──► Date.now() + currentOffset ──► Date object
```

The library does not contact any external service during `now()` calls — it applies the previously computed offset to the local system clock.

### 3. Smooth Correction

When a new sync is completed and the offset has changed:

```
New offset received
    │
    ├─ diff < maxCorrectionJump ──► apply instantly
    ├─ diff > maxOffsetThreshold ──► apply instantly
    └─ otherwise ──► apply gradually at correctionRate per sync cycle
                     until diff < 0.5 ms (converged) or 30 s elapsed
```

### 4. Auto-Sync

```
startAutoSync(interval)
    │
    └─ setInterval ──► sync() every `interval` ms
                       (default: 300 000 ms / 5 min)
```

### 5. WebSocket Server (optional)

```
Application ──► startWebSocketServer(port)
                    │
                    └─ ws.Server listens on TCP :port
                           │
                           ├─ on 'connection' ──► add client to Set
                           ├─ on 'close'      ──► remove client from Set
                           └─ on each sync    ──► broadcast { timestamp } to all clients
```

WebSocket clients receive a JSON message `{ data: { timestamp: <ISO string> } }` after each sync.

## Trust Boundaries

| Boundary | Notes |
|----------|-------|
| Application → NTP servers | UDP, no authentication. NTP v4 does not provide integrity guarantees by default. Multiple servers + coherence validation reduce spoofing risk. |
| Application → WebSocket clients | The library does not implement authentication for WebSocket connections. The embedding application is responsible for access control. |
| Application → Library | The library trusts all inputs from the application. Input validation is the application's responsibility. |

## External Dependencies

| Dependency | Purpose |
|------------|---------|
| `ws` | WebSocket server (only loaded if `startWebSocketServer` is called) |
| Node.js built-ins: `dgram`, `events` | UDP socket for NTP, EventEmitter base class |
