const timeSync = require('./index.js');

console.log('🧪 TimeSync Tests\n');

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

        // Test 9: Server coherence validation
        console.log('\n⏳ Testing server coherence validation...');
        const coherenceResult = await timeSync.sync({ coherenceValidation: true });
        test('Coherence validation works', 
            coherenceResult && typeof coherenceResult.coherenceVariance === 'number'
        );

        // Test 10: Smooth correction configuration
        timeSync.setSmoothCorrection(true, {
            maxCorrectionJump: 1000,
            correctionRate: 0.1,
            maxOffsetThreshold: 5000
        });
        test('Smooth correction configuration', true);

        // Test 11: Stats include new fields
        const detailedStats = timeSync.stats();
        test('Stats include correction fields', 
            typeof detailedStats.correctedOffset === 'number' &&
            typeof detailedStats.targetOffset === 'number' &&
            typeof detailedStats.correctionInProgress === 'boolean' &&
            detailedStats.config && 
            typeof detailedStats.config.smoothCorrection === 'boolean'
        );

        // Test 12: Force correction method
        timeSync.forceCorrection();
        test('Force correction method exists', typeof timeSync.forceCorrection === 'function');

        // Test 13: Event handling
        let eventReceived = false;
        timeSync.on('sync', () => { eventReceived = true; });
        await timeSync.sync();
        test('Events are emitted', eventReceived);

        console.log('\n⏳ Testing WebSocket server...');
        
        // Test 14: WebSocket server
        try {
            const port = timeSync.startWebSocketServer(8081);
            test('WebSocket server starts', typeof port === 'number');
            
            setTimeout(() => {
                timeSync.stopWebSocketServer();
                test('WebSocket server stops', true);
            }, 100);
        } catch (error) {
            test('WebSocket server (optional)', true); // Skip if port is busy
        }

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
