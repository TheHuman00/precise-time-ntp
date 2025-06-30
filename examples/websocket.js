const timeSync = require('../index.js');

async function webSocketExample() {
  try {
    await timeSync.sync();
    const port = timeSync.startWebSocketServer(8080);
    timeSync.startAutoSync(60000);
    
    console.log(`🌐 WebSocket Clock: http://localhost:${port}`);
    console.log('💡 Open examples-simple/clock.html in your browser');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

webSocketExample();
