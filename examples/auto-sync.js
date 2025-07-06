const timeSync = require('../index.js');

async function autoSyncExample() {
  try {
    // Initial sync
    await timeSync.sync();
    console.log('Synchronized! Offset:', timeSync.offset(), 'ms');
    
    // Start auto-sync every 5 minutes
    timeSync.startAutoSync(300000);
    console.log('Auto-sync started');
    
    // Listen for sync events
    timeSync.on('synced', (data) => {
      console.log('Re-synced! Offset:', data.offset, 'ms');
    });
    
    timeSync.on('error', (err) => {
      console.log('Sync error:', err.message);
    });
    
    // Display current time every 10 seconds
    setInterval(() => {
      console.log('Current time:', timeSync.now().toISOString());
    }, 10000);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

autoSyncExample();
