const timeSync = require('../index.js');

async function monitoringExample() {
  try {
    await timeSync.sync();
    
    // Get detailed synchronization information
    const stats = timeSync.stats();
    
    console.log('=== Time Synchronization Status ===');
    console.log('Synchronized:', stats.synchronized);
    console.log('Current offset:', stats.offset, 'ms');
    console.log('Last sync:', stats.lastSync.toISOString());
    console.log('Uptime:', Math.round(stats.uptime), 'ms');
    
    // Smooth correction information
    if (stats.correctionInProgress) {
      console.log('\n=== Smooth Correction Active ===');
      console.log('Target offset:', stats.targetOffset, 'ms');
      console.log('Applied offset:', stats.correctedOffset, 'ms');
      console.log('Remaining correction:', Math.abs(stats.targetOffset - stats.correctedOffset), 'ms');
    } else {
      console.log('\n=== No Correction Needed ===');
      console.log('Time is precisely synchronized');
    }
    
    // Configuration details
    console.log('\n=== Configuration ===');
    console.log('Smooth correction:', stats.config.smoothCorrection);
    console.log('Max correction jump:', stats.config.maxCorrectionJump, 'ms');
    console.log('Correction rate:', (stats.config.correctionRate * 100).toFixed(1) + '%');
    console.log('Force threshold:', stats.config.maxOffsetThreshold, 'ms');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

monitoringExample();
