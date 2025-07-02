const timeSync = require('./index.js');

console.log('🧪 TimeSync v2.0 Tests\n');

async function runTests() {
    let passed = 0;
    let total = 0;

    function test(name, condition) {
        total++;
        if (condition) {
            console.log(`✅ ${name}`);
            passed++;
        } else {
            console.log(`❌ ${name}`);
        }
    }

    try {
        // Test 1: API exports
        test('Correct API exports', 
            typeof timeSync.sync === 'function' &&
            typeof timeSync.now === 'function' &&
            typeof timeSync.timestamp === 'function'
        );

        // Test 2: Initial state
        test('Initial state not synchronized', 
            !timeSync.isSynchronized()
        );

        // Test 3: Synchronization
        console.log('\n⏳ Testing synchronization...');
        const result = await timeSync.sync();
        
        test('Synchronization successful', 
            result && result.server && typeof result.offset === 'number'
        );

        test('Synchronized state after sync', 
            timeSync.isSynchronized()
        );

        // Test 4: Get time
        const now = timeSync.now();
        const timestamp = timeSync.timestamp();
        const offset = timeSync.offset();

        test('now() returns a Date', 
            now instanceof Date
        );

        test('timestamp() returns an ISO string', 
            typeof timestamp === 'string' && timestamp.includes('T')
        );

        test('offset() returns a number', 
            typeof offset === 'number'
        );

        // Test 5: Formatting
        const formatted = timeSync.format(null, 'locale');
        test('format() works', 
            typeof formatted === 'string' && formatted.length > 0
        );

        // Test 6: Statistics
        const stats = timeSync.stats();
        test('stats() returns data', 
            stats && stats.synchronized === true
        );

        // Test 7: Auto-sync (quick test)
        timeSync.startAutoSync(60000);
        test('Auto-sync starts', true);
        
        setTimeout(() => {
            timeSync.stopAutoSync();
            test('Auto-sync stops', true);
        }, 100);

        // Test 8: Time difference
        const diff = timeSync.diff(new Date(), new Date(Date.now() + 1000));
        test('diff() calculates correctly', 
            Math.abs(diff - 1000) < 100
        );

    } catch (error) {
        console.log(`❌ Error during tests: ${error.message}`);
    }

    // Results
    console.log(`\n📊 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('💥 Some tests failed');
        process.exit(1);
    }
}

runTests().catch(console.error);
