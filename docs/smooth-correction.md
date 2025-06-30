# 🔧 Smooth Time Correction

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
- ⚠️ `setTimeout()` and `setInterval()` behave erratically
- ⚠️ Performance measurements show negative durations
- ⚠️ Database timestamps become inconsistent
- ⚠️ Real-time games and animations stutter
- ⚠️ Monitoring systems show false spikes

## The Solution: Gradual Correction

Smooth correction gradually adjusts time over multiple sync cycles instead of making instant jumps.

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
```

### How It Works

**Example: System is 3 seconds behind**

Without smooth correction:
```
Sync 1: +3000ms instant jump ⚡ (jarring!)
```

With smooth correction (10% rate):
```
Sync 1: +300ms (10% of 3000ms)
Sync 2: +270ms (10% of remaining 2700ms)  
Sync 3: +243ms (10% of remaining 2430ms)
...
Total: Gradually corrects over ~10 sync cycles 🌊
```

## Configuration Options

### `maxCorrectionJump` (Default: 1000ms)
Maximum instant correction allowed before switching to gradual mode.

```javascript
// Small jumps allowed, good for real-time apps
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 500  // Only allow 0.5s instant jumps
});

// Larger jumps allowed, faster correction
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 2000  // Allow 2s instant jumps
});
```

### `correctionRate` (Default: 0.1)
How much of the offset to correct per sync cycle (0.0 to 1.0).

```javascript
// Slow, gentle correction
timeSync.setSmoothCorrection(true, {
    correctionRate: 0.05  // 5% per cycle (20 cycles to correct)
});

// Fast correction
timeSync.setSmoothCorrection(true, {
    correctionRate: 0.2   // 20% per cycle (5 cycles to correct)
});
```

### `maxOffsetThreshold` (Default: 10000ms)
Force instant correction if offset exceeds this value.

```javascript
// Force correction sooner
timeSync.setSmoothCorrection(true, {
    maxOffsetThreshold: 3000  // Force instant if >3s off
});

// Allow larger gradual corrections  
timeSync.setSmoothCorrection(true, {
    maxOffsetThreshold: 30000  // Force instant only if >30s off
});
```

## Production Configurations

### High-Precision Applications
For trading, monitoring, or real-time systems:

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 100,      // Very small instant jumps
    correctionRate: 0.05,        // Gentle 5% correction
    maxOffsetThreshold: 1000     // Force correction at 1s
});

// Sync frequently to minimize drift
timeSync.startAutoSync(60000); // Every minute
```

### General Web Applications
For typical web apps and APIs:

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,     // 1s instant jumps OK
    correctionRate: 0.1,         // 10% correction
    maxOffsetThreshold: 5000     // Force at 5s
});

// Normal sync frequency
timeSync.startAutoSync(300000); // Every 5 minutes
```

### Background Services
For logging, cron jobs, or batch processing:

```javascript
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 2000,     // 2s jumps acceptable
    correctionRate: 0.2,         // Faster 20% correction
    maxOffsetThreshold: 10000    // Force at 10s
});

// Less frequent sync
timeSync.startAutoSync(600000); // Every 10 minutes
```

## Monitoring Smooth Correction

### Track Correction Progress

```javascript
timeSync.on('sync', (data) => {
    console.log(`Server: ${data.server}`);
    console.log(`Offset before: ${data.offsetBefore}ms`);
    console.log(`Offset after: ${data.offsetAfter}ms`);
    console.log(`Correction applied: ${data.correctionApplied}ms`);
    console.log(`Smooth mode: ${data.smoothMode ? 'ON' : 'OFF'}`);
});
```

### Debug Correction Behavior

```javascript
const timeSync = require('precise-time-ntp');

// Enable detailed logging
timeSync.setSmoothCorrection(true, {
    maxCorrectionJump: 1000,
    correctionRate: 0.1,
    maxOffsetThreshold: 5000,
    debug: true  // Log correction decisions
});

await timeSync.sync();
```

## Disabling Smooth Correction

For testing or when you want instant corrections:

```javascript
// Disable smooth correction (default behavior)
timeSync.setSmoothCorrection(false);

// Or completely skip the call
// timeSync.setSmoothCorrection() not called = disabled
```

## Best Practices

### ✅ Enable for Production
Always enable smooth correction in production to prevent time jump issues.

### ✅ Tune for Your Use Case
- **Real-time apps**: Small jumps, slow correction
- **Background services**: Larger jumps, faster correction
- **High-precision**: Frequent sync, minimal jumps

### ✅ Monitor Offset
Watch the offset values to tune your configuration:

```javascript
setInterval(() => {
    const offset = timeSync.offset();
    if (Math.abs(offset) > 1000) {
        console.warn(`Large offset detected: ${offset}ms`);
    }
}, 60000);
```

### ✅ Test Edge Cases
Test your application with simulated large time offsets to ensure smooth correction works as expected.

Smooth correction ensures your application maintains stable, monotonic time even when system clocks drift significantly! 🎯
}, 1000);
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
  if (Math.abs(timeSync.offset()) > 10000) {
    console.warn('⚠️ Critical offset detected, forcing correction');
    timeSync.forceCorrection();
  }
}, 60000);
```

Smooth correction transforms your application from a system with annoying time jumps to one with fluid and predictable time! 🎯

## ❓ FAQ : Pourquoi l'Offset Reste Constant ?

### C'est Normal ! Voici Pourquoi

L'offset constant (ex: 40ms) n'est **PAS un problème**, c'est le fonctionnement normal :

```javascript
// Exemple typique
await timeSync.sync();
console.log(timeSync.offset()); // 42ms
// ... 5 minutes plus tard ...
console.log(timeSync.offset()); // 42ms (toujours pareil)
```

### Explication Technique

L'**offset** représente la **différence constante** entre :
- L'horloge de votre ordinateur (qui peut être légèrement décalée)
- L'heure précise du serveur NTP

```javascript
// Formule simplifiée :
const offset = heureServeurNTP - heureOrdinateur;
// Si votre PC est en retard de 40ms : offset = +40ms
// Si votre PC est en avance de 40ms : offset = -40ms
```

### Pourquoi l'Offset Ne Change Pas

1. **Horloge système stable** : Votre ordinateur maintient un rythme régulier
2. **Décalage fixe** : La différence avec le serveur NTP reste constante
3. **Précision** : C'est exactement ce qu'on veut !

```javascript
// Temps réel :
// 14:30:00.000 (serveur NTP)
// 14:29:59.960 (votre PC) → offset = +40ms

// 5 minutes plus tard :
// 14:35:00.000 (serveur NTP)  
// 14:34:59.960 (votre PC) → offset = +40ms (toujours!)
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
