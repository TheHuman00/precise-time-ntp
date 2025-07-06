const timeSync = require('../index.js');

async function basicExample() {
  try {
    await timeSync.sync();
    
    console.log('Precise time:', timeSync.timestamp());
    console.log('Offset:', timeSync.offset(), 'ms');
    console.log('Stats:', timeSync.stats());
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

basicExample();
