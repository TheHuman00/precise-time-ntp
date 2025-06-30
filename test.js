const timeSync = require('./index.js');

console.log('🧪 Tests TimeSync v2.0\n');

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
        test('API exports correcte', 
            typeof timeSync.sync === 'function' &&
            typeof timeSync.now === 'function' &&
            typeof timeSync.timestamp === 'function'
        );

        // Test 2: État initial
        test('État initial non synchronisé', 
            !timeSync.isSynchronized()
        );

        // Test 3: Synchronisation
        console.log('\n⏳ Test de synchronisation...');
        const result = await timeSync.sync();
        
        test('Synchronisation réussie', 
            result && result.server && typeof result.offset === 'number'
        );

        test('État synchronisé après sync', 
            timeSync.isSynchronized()
        );

        // Test 4: Obtenir l'heure
        const now = timeSync.now();
        const timestamp = timeSync.timestamp();
        const offset = timeSync.offset();

        test('now() retourne une Date', 
            now instanceof Date
        );

        test('timestamp() retourne une string ISO', 
            typeof timestamp === 'string' && timestamp.includes('T')
        );

        test('offset() retourne un number', 
            typeof offset === 'number'
        );

        // Test 5: Formatage
        const formatted = timeSync.format(null, 'locale');
        test('format() fonctionne', 
            typeof formatted === 'string' && formatted.length > 0
        );

        // Test 6: Statistiques
        const stats = timeSync.stats();
        test('stats() retourne des données', 
            stats && stats.synchronized === true
        );

        // Test 7: Auto-sync (test rapide)
        timeSync.startAutoSync(60000);
        test('Auto-sync démarre', true);
        
        setTimeout(() => {
            timeSync.stopAutoSync();
            test('Auto-sync s\'arrête', true);
        }, 100);

        // Test 8: Différence de temps
        const diff = timeSync.diff(new Date(), new Date(Date.now() + 1000));
        test('diff() calcule correctement', 
            Math.abs(diff - 1000) < 100
        );

    } catch (error) {
        console.log(`❌ Erreur pendant les tests: ${error.message}`);
    }

    // Résultats
    console.log(`\n📊 Résultats: ${passed}/${total} tests réussis`);
    
    if (passed === total) {
        console.log('🎉 Tous les tests sont passés !');
        process.exit(0);
    } else {
        console.log('💥 Certains tests ont échoué');
        process.exit(1);
    }
}

runTests().catch(console.error);
