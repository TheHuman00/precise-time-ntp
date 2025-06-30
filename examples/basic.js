const timeSync = require('../index.js');

async function basicExample() {
  try {
    console.log('⏳ Synchronizing...');
    await timeSync.sync();
    
    console.log('✅ Synchronized!');
    console.log('Precise time:', timeSync.timestamp());
    console.log('Offset:', timeSync.offset(), 'ms');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

basicExample();
