/**
 * Framework de test simple pour GR10 Dashboard
 * Fournit les outils de base pour les tests unitaires
 */
class TestFramework {
    constructor() {
        this.suites = [];
        this.currentSuite = null;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        };
    }

    /**
     * Crée une nouvelle suite de tests
     */
    describe(name, callback) {
        this.currentSuite = {
            name: name,
            tests: [],
            beforeEach: null,
            afterEach: null
        };
        
        callback();
        this.suites.push(this.currentSuite);
        this.currentSuite = null;
    }

    /**
     * Définit un test individuel
     */
    it(description, testFunction) {
        if (!this.currentSuite) {
            throw new Error('Test must be inside a describe block');
        }

        this.currentSuite.tests.push({
            description: description,
            test: testFunction,
            status: 'pending'
        });
    }

    /**
     * Fonction à exécuter avant chaque test
     */
    beforeEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = callback;
        }
    }

    /**
     * Fonction à exécuter après chaque test
     */
    afterEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = callback;
        }
    }

    /**
     * Assertions de base
     */
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toThrow: () => {
                let threw = false;
                try {
                    actual();
                } catch (e) {
                    threw = true;
                }
                if (!threw) {
                    throw new Error('Expected function to throw an error');
                }
            },
            toBeInstanceOf: (constructor) => {
                if (!(actual instanceof constructor)) {
                    throw new Error(`Expected ${actual} to be instance of ${constructor.name}`);
                }
            }
        };
    }

    /**
     * Exécute tous les tests
     */
    async runAll() {
        this.results = { total: 0, passed: 0, failed: 0, skipped: 0 };
        const output = [];

        for (const suite of this.suites) {
            const suiteResult = await this.runSuite(suite);
            output.push(suiteResult);
        }

        this.displayResults(output);
    }

    /**
     * Exécute une suite de tests
     */
    async runSuite(suite) {
        const suiteResult = {
            name: suite.name,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0
        };

        for (const test of suite.tests) {
            try {
                // Exécuter beforeEach si défini
                if (suite.beforeEach) {
                    await suite.beforeEach();
                }

                // Exécuter le test
                await test.test();
                
                test.status = 'passed';
                test.error = null;
                suiteResult.passed++;
                this.results.passed++;

                // Exécuter afterEach si défini
                if (suite.afterEach) {
                    await suite.afterEach();
                }

            } catch (error) {
                test.status = 'failed';
                test.error = error.message;
                suiteResult.failed++;
                this.results.failed++;
            }

            suiteResult.tests.push(test);
            this.results.total++;
        }

        return suiteResult;
    }

    /**
     * Affiche les résultats des tests
     */
    displayResults(results) {
        const output = document.getElementById('test-output');
        
        let html = '';
        
        // Résultats par suite
        results.forEach(suite => {
            html += `
                <div class="test-suite">
                    <div class="test-suite-header">
                        📋 ${suite.name} (${suite.passed}/${suite.tests.length} réussis)
                    </div>
                    ${suite.tests.map(test => `
                        <div class="test-case">
                            <span>${test.description}</span>
                            <span class="test-status test-${test.status}">
                                ${test.status === 'passed' ? '✅ PASS' : '❌ FAIL'}
                            </span>
                        </div>
                        ${test.error ? `<div class="error-details">${test.error}</div>` : ''}
                    `).join('')}
                </div>
            `;
        });

        // Résumé global
        html += `
            <div class="test-summary">
                <div class="summary-item">
                    <div class="summary-number" style="color: #059669;">${this.results.passed}</div>
                    <div class="summary-label">Tests réussis</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number" style="color: #dc2626;">${this.results.failed}</div>
                    <div class="summary-label">Tests échoués</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number" style="color: #2563eb;">${this.results.total}</div>
                    <div class="summary-label">Total</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number" style="color: ${this.results.failed === 0 ? '#059669' : '#dc2626'};">
                        ${Math.round((this.results.passed / this.results.total) * 100)}%
                    </div>
                    <div class="summary-label">Taux de réussite</div>
                </div>
            </div>
        `;

        output.innerHTML = html;
    }
}

// Instance globale
const TestRunner = new TestFramework();

// API globale
window.describe = (name, callback) => TestRunner.describe(name, callback);
window.it = (description, testFunction) => TestRunner.it(description, testFunction);
window.beforeEach = (callback) => TestRunner.beforeEach(callback);
window.afterEach = (callback) => TestRunner.afterEach(callback);
window.expect = (actual) => TestRunner.expect(actual);
