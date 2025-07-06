# Smooth Time Correction

The smooth correction feature provides gradual time adjustments to prevent application disruption while maintaining precision.

## Features

- Automatic convergence detection (within 0.5ms)
- Timeout protection (30 seconds max)
- Adaptive correction intervals
- Server coherence validation
- Drift detection and warnings

## Configuration

### 1. Convergence Detection
The correction system ensures convergence within 0.5ms precision:

```javascript
// Automatic convergence detection
timeSync.on('correctionComplete', (data) => {
    if (data.converged) {
        console.log(`Perfect convergence: ${data.finalOffset}ms`);
    }
});
```

### 2. Server Coherence Validation
Automatically tests multiple NTP servers and detects anomalies:

```javascript
await timeSync.sync({ coherenceValidation: true });

timeSync.on('coherenceWarning', (data) => {
    console.log(`Variance between servers: ${data.variance}ms`);
    console.log('Servers:', data.servers);
});
```

### 3. Drift Detection
Monitors system clock drift and warns when re-sync is needed:

```javascript
timeSync.on('driftWarning', (data) => {
    const hours = (data.elapsed / 3600000).toFixed(1);
    console.log(`Clock has been running for ${hours} hours without sync`);
});
```

### 4. Timeout Protection
Prevents infinite correction loops with automatic timeout:

```javascript
// Correction automatically times out after 30 seconds
timeSync.on('correctionComplete', (data) => {
    if (data.timeout) {
        console.log('Correction timed out, applied final offset');
    }
});
```

### 5. Adaptive Intervals
Correction intervals automatically adjust based on offset size for optimal performance.

## The Time Jump Problem

When your system clock has a significant offset, instant correction can cause serious issues in running applications.

### What Happens Without Smooth Correction

```javascript
// ❌ PROBLEM: Without smooth correction
const timeSync = require('precise-time-ntp');

await timeSync.sync(); // System is 3 seconds behind

// Later, during auto-sync...
// Time instantly jumps forward 3 seconds!
// This can break:
// - Running timers and intervals
// - Performance measurements  
// - Real-time applications
// - Log timestamps
```

**Real-world consequences:**
- `setTimeout()` and `setInterval()` behave erratically
- Performance measurements show negative durations
- Database timestamps become inconsistent
- Real-time games and animations stutter
- Monitoring systems show false spikes

## The Solution: Gradual Correction

Smooth correction gradually adjusts time over multiple sync cycles with convergence detection and server validation.

### Basic Setup

```javascript
const timeSync = require('precise-time-ntp');

// Enable smooth correction (recommended for production)
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,     // Max 1s instant jump
    correctionRate: 0.1,         // Correct 10% per sync cycle
    maxOffsetThreshold: 5000     // Force instant if >5s off
});

await timeSync.sync();
timeSync.startAutoSync(300000); // Auto-sync every 5 minutes

// Listen for completion events
timeSync.on('correctionComplete', (data) => {
    console.log(`Correction completed: ${data.finalOffset}ms`);
    if (data.converged) console.log('Perfect convergence achieved');
});
```

### How It Works

1. **Offset Detection**: During sync, compare new offset with current
2. **Correction Decision**:
   - If `offset < maxCorrectionJump` → Brutal correction (fast)
   - If `offset > maxOffsetThreshold` → Brutal correction (necessary)
   - Otherwise → Smooth correction
3. **Gradual Application**: Offset is corrected progressively at configured rate

### Practical Example

```javascript
// Detected offset: 2500ms
// maxCorrectionJump: 1000ms → Smooth correction
// correctionRate: 0.1 (10%)

// Sync 1: 2500ms → 2250ms (corrected 250ms)
// Sync 2: 2250ms → 2025ms (corrected 225ms)
// Sync 3: 2025ms → 1822ms (corrected 203ms)
// ... until convergence
```

## Events and Monitoring

### Listen to Corrections

```javascript
timeSync.on('sync', (data) => {
  if (data.gradualCorrection) {
    console.log(`🔧 Smooth correction enabled`);
    console.log(`   Real offset: ${data.offset}ms`);
    console.log(`   Applied offset: ${data.correctedOffset}ms`);
    console.log(`   Difference: ${data.offsetDiff}ms`);
  }
});

timeSync.on('correctionComplete', (data) => {
  console.log(`✅ Correction completed: ${data.finalOffset}ms`);
});
```

### Detailed Statistics

```javascript
const stats = timeSync.stats();
console.log({
  offset: stats.offset,                    // Real server offset
  correctedOffset: stats.correctedOffset, // Applied offset
  targetOffset: stats.targetOffset,       // Target offset
  correctionInProgress: stats.correctionInProgress
});
```

## Advanced Configuration

### Specific Use Cases

```javascript
// For precise logs (slow but smooth correction)
timeSync.setSmoothCorrection(true, {
  maxCorrectionJump: 500,     // Very small jumps
  correctionRate: 0.05,       // Very gradual (5%)
  maxOffsetThreshold: 10000   // High threshold
});

// For real-time apps (balanced)
timeSync.setSmoothCorrection(true, {
  maxCorrectionJump: 1000,    // Moderate jumps
  correctionRate: 0.1,        // Normal correction (10%)
  maxOffsetThreshold: 5000    // Standard threshold
});

// For performance measurements (fast correction)
timeSync.setSmoothCorrection(true, {
  maxCorrectionJump: 2000,    // Larger accepted jumps
  correctionRate: 0.2,        // Fast correction (20%)
  maxOffsetThreshold: 3000    // Low threshold
});
```

### Dynamic Disable

```javascript
// In emergency, force correction
timeSync.forceCorrection();

// Or temporarily disable
timeSync.setSmoothCorrection(false);
```

## Recommendations

### When to Use Smooth Correction

✅ **Recommended for:**
- Web applications with animations
- Precise logging systems
- Real-time applications
- Performance measurements
- Any system requiring monotonic time

❌ **Not necessary for:**
- Simple batch scripts
- Applications tolerant to jumps
- Systems with very frequent sync (< 1min)

### Best Practices

1. **Test first**: Use examples to see the effect
2. **Adjust for context**: Different parameters per application
3. **Monitor**: Watch correction events
4. **Fallback**: Keep ability to force correction

```javascript
// Robust configuration
timeSync.setSmoothCorrection(true, {
  maxCorrectionJump: 1000,
  correctionRate: 0.1,
  maxOffsetThreshold: 5000
});

// With emergency fallback
setTimeout(() => {
## Monitoring and Best Practices

### Event-Driven Monitoring

```javascript
// Comprehensive monitoring setup
timeSync.on('sync', (data) => {
    console.log(`✅ Synced with ${data.server}`);
    console.log(`📊 Offset: ${data.offset}ms`);
    if (data.coherenceVariance) {
        console.log(`🔍 Server variance: ${data.coherenceVariance}ms`);
    }
});

timeSync.on('coherenceWarning', (data) => {
    // Log warning and potentially alert administrators
    console.warn(`⚠️ NTP servers variance: ${data.variance}ms`);
    console.warn('Servers tested:', data.servers);
    
    // Consider switching to backup servers if variance is too high
    if (data.variance > 500) {
        console.error('🚨 Critical NTP variance detected!');
    }
});

timeSync.on('driftWarning', (data) => {
    const hours = (data.elapsed / 3600000).toFixed(1);
    console.warn(`⏰ Clock drift: ${hours}h without sync`);
    
    // Trigger immediate re-sync
    timeSync.sync().catch(console.error);
});

timeSync.on('correctionComplete', (data) => {
    console.log(`🎯 Correction completed: ${data.finalOffset}ms`);
    if (data.timeout) {
        console.warn('⚠️ Correction timed out');
    }
    if (data.converged) {
        console.log('Perfect convergence achieved');
    }
});
```

### Health Check Function

```javascript
function checkTimeSyncHealth() {
    const stats = timeSync.stats();
    
    const health = {
        synchronized: stats.synchronized,
        offset: stats.offset,
        correctedOffset: stats.correctedOffset,
        correctionInProgress: stats.correctionInProgress,
        uptime: stats.uptime,
        // Advanced metrics
        serverCoherence: stats.serverOffsets ? 
            Object.keys(stats.serverOffsets).length > 1 : false,
        lastSyncAge: Date.now() - (stats.lastSync?.getTime() || 0),
        
        // Health indicators
        status: 'healthy'
    };
    
    // Determine health status
    if (!health.synchronized) {
        health.status = 'critical';
        health.issue = 'Not synchronized';
    } else if (health.lastSyncAge > 3600000) { // > 1 hour
        health.status = 'warning';
        health.issue = 'Sync too old';
    } else if (Math.abs(health.offset) > 1000) { // > 1 second
        health.status = 'warning';
        health.issue = 'High offset';
    }
    
    return health;
}

// Use in monitoring
setInterval(() => {
    const health = checkTimeSyncHealth();
    if (health.status !== 'healthy') {
        console.warn('TimeSync Health Issue:', health);
    }
}, 60000); // Check every minute
```

### Robust Error Handling

```javascript
// Comprehensive error handling
async function robustTimeSync() {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await timeSync.sync({
                coherenceValidation: true,
                timeout: 5000
            });
            
            console.log(`✅ Sync successful on attempt ${attempt}`);
            return;
            
        } catch (error) {
            lastError = error;
            console.warn(`❌ Sync attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All attempts failed
    console.error(`🚨 All sync attempts failed. Last error: ${lastError.message}`);
    
    // Fallback: disable coherence validation and try once more
    try {
        await timeSync.sync({ coherenceValidation: false });
        console.log('✅ Fallback sync successful (coherence validation disabled)');
    } catch (error) {
        console.error('🚨 Even fallback sync failed:', error.message);
        throw error;
    }
}
```

Smooth correction transforms your application from a system with jarring time jumps to one with fluid and predictable time behavior! 🎯

## ❓ FAQ: Why Does the Offset Stay Constant?

### This is Normal! Here's Why

A constant offset (e.g., 40ms) is **NOT a problem** - it's normal behavior:

```javascript
// Typical example
await timeSync.sync();
console.log(timeSync.offset()); // 42ms
// ... 5 minutes later ...
console.log(timeSync.offset()); // 42ms (still the same)
```

### Technical Explanation

The **offset** represents the **constant difference** between:
- Your computer's clock (which may be slightly off)
- The precise time from the NTP server

```javascript
// Simplified formula:
const offset = ntpServerTime - computerTime;
// If your PC is 40ms behind: offset = +40ms
// If your PC is 40ms ahead: offset = -40ms
```

### Why the Offset Doesn't Change

1. **Stable system clock**: Your computer maintains a regular rhythm
2. **Fixed difference**: The difference with the NTP server remains constant
3. **Precision**: This is exactly what we want!

```javascript
// Real time example:
// 14:30:00.000 (NTP server)
// 14:29:59.960 (your PC) → offset = +40ms

// 5 minutes later:
// 14:35:00.000 (NTP server)
// 14:34:59.960 (your PC) → offset = +40ms (still the same!)
```

### Quand l'Offset Doit-il Changer ?

L'offset ne change que si :

✅ **Changements normaux :**
- Température du processeur (dilatation des composants)
- Charge système élevée
- Mise à jour système
- Redémarrage

❌ **Problèmes à surveiller :**
- Offset qui dérive constamment (horloge défaillante)
- Sauts brusques très fréquents
- Offset qui augmente sans cesse

### Surveillance des Dérives

```javascript
const timeSync = require('precise-time-ntp');

let lastOffset = 0;
let driftHistory = [];

timeSync.on('sync', (data) => {
  const currentOffset = data.offset;
  const drift = Math.abs(currentOffset - lastOffset);
  
  driftHistory.push(drift);
  
  // Garder seulement les 10 dernières mesures
  if (driftHistory.length > 10) {
    driftHistory.shift();
  }
  
  const avgDrift = driftHistory.reduce((a, b) => a + b, 0) / driftHistory.length;
  
  console.log(`📊 Offset: ${currentOffset}ms | Dérive: ${drift}ms | Moy: ${avgDrift.toFixed(1)}ms`);
  
  // Alerte si dérive excessive
  if (avgDrift > 100) {
    console.warn('⚠️ Dérive d\'horloge élevée détectée !');
  }
  
  lastOffset = currentOffset;
});
```

### Offsets Typiques par Appareil

| Type d'appareil | Offset typique | Commentaire |
|------------------|----------------|-------------|
| PC Desktop | 10-50ms | Très stable |
| Laptop | 20-80ms | Varie selon l'alimentation |
| Serveur | 5-20ms | Horloge précise |
| Raspberry Pi | 50-200ms | Horloge moins précise |
| VM/Container | 10-100ms | Dépend de l'hyperviseur |

### Exemple de Monitoring

```javascript
// Script de surveillance d'horloge
const timeSync = require('precise-time-ntp');

async function monitorClock() {
  await timeSync.sync();
  timeSync.startAutoSync(60000); // Sync toutes les minutes
  
  let measurements = [];
  
  timeSync.on('sync', (data) => {
    measurements.push({
      timestamp: new Date(),
      offset: data.offset,
      server: data.server
    });
    
    // Analyse des 10 dernières mesures
    if (measurements.length >= 10) {
      const recent = measurements.slice(-10);
      const offsets = recent.map(m => m.offset);
      
      const min = Math.min(...offsets);
      const max = Math.max(...offsets);
      const avg = offsets.reduce((a, b) => a + b) / offsets.length;
      const stability = max - min;
      
      console.log(`\n📈 Analyse de stabilité :`);
      console.log(`   Offset moyen: ${avg.toFixed(1)}ms`);
      console.log(`   Plage: ${min}ms - ${max}ms`);
      console.log(`   Stabilité: ${stability.toFixed(1)}ms`);
      
      if (stability > 500) {
        console.warn('⚠️ Horloge instable détectée !');
      } else {
        console.log('✅ Horloge stable');
      }
    }
  });
}

monitorClock();
```
