const timeSync = require('../index.js');

async function autoSyncExample() {
  try {
    await timeSync.sync();
    timeSync.startAutoSync(60000); // Every minute
    
    console.log('🔄 Auto-sync enabled');
    
    setInterval(() => {
      const now = timeSync.format(null, 'locale');
      console.log('Precise time:', now);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

autoSyncExample();
