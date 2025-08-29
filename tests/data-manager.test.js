/**
 * Tests pour DataManager
 */
describe('DataManager', () => {
    let dataManager;
    let originalFetch;
    let originalItineraryData;

    beforeEach(() => {
        // Sauvegarder les valeurs originales
        originalFetch = window.fetch;
        originalItineraryData = window.itineraryData;
        
        dataManager = new DataManager();
    });

    afterEach(() => {
        // Restaurer les valeurs originales
        window.fetch = originalFetch;
        window.itineraryData = originalItineraryData;
    });

    it('should initialize correctly', () => {
        expect(dataManager).toBeInstanceOf(DataManager);
        expect(dataManager.stages).toEqual([]);
        expect(dataManager.isLoaded).toBeFalsy();
    });

    it('should load stages from window.itineraryData', async () => {
        const mockData = [
            { etape: 1, depart: 'Hendaye', arrivee: 'Col d\'Ibardin', distance: '15 km' },
            { etape: 2, depart: 'Col d\'Ibardin', arrivee: 'Bidarray', distance: '20 km' }
        ];
        
        window.itineraryData = mockData;
        
        const result = await dataManager.loadStages();
        
        expect(result).toEqual(mockData);
        expect(dataManager.stages).toEqual(mockData);
        expect(dataManager.isLoaded).toBeTruthy();
    });

    it('should fallback to JSON fetch when window.itineraryData is not available', async () => {
        window.itineraryData = null;
        
        const mockData = [
            { etape: 1, depart: 'Hendaye', arrivee: 'Col d\'Ibardin' }
        ];
        
        window.fetch = jest.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        const result = await dataManager.loadStages();
        
        expect(result).toEqual(mockData);
        expect(dataManager.isLoaded).toBeTruthy();
    });

    it('should handle loading errors gracefully', async () => {
        window.itineraryData = null;
        window.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
        
        const result = await dataManager.loadStages();
        
        expect(result).toEqual([]);
        expect(dataManager.stages).toEqual([]);
        expect(dataManager.isLoaded).toBeFalsy();
    });

    it('should return all stages', () => {
        const mockStages = [
            { etape: 1, depart: 'A', arrivee: 'B' },
            { etape: 2, depart: 'B', arrivee: 'C' }
        ];
        
        dataManager.stages = mockStages;
        
        expect(dataManager.getAllStages()).toEqual(mockStages);
    });

    it('should find stage by day', () => {
        const mockStages = [
            { day: 1, depart: 'A', arrivee: 'B' },
            { day: 2, depart: 'B', arrivee: 'C' }
        ];
        
        dataManager.stages = mockStages;
        
        expect(dataManager.getStageByDay(1)).toEqual(mockStages[0]);
        expect(dataManager.getStageByDay(2)).toEqual(mockStages[1]);
        expect(dataManager.getStageByDay(99)).toBeUndefined();
    });

    it('should filter stages by difficulty', () => {
        const mockStages = [
            { day: 1, difficulty: 'Simple' },
            { day: 2, difficulty: 'Moyenne' },
            { day: 3, difficulty: 'Simple' }
        ];
        
        dataManager.stages = mockStages;
        
        const simpleStages = dataManager.getStagesByDifficulty('Simple');
        expect(simpleStages).toHaveLength(2);
        expect(simpleStages[0].day).toBe(1);
        expect(simpleStages[1].day).toBe(3);
    });

    it('should calculate global stats correctly', () => {
        const mockStages = [
            { 
                distance: '15 km', 
                elevation: '+850m / -450m', 
                difficulty: 'Simple' 
            },
            { 
                distance: '20.5 km', 
                elevation: '+1200m / -800m', 
                difficulty: 'Moyenne' 
            }
        ];
        
        dataManager.stages = mockStages;
        
        const stats = dataManager.getGlobalStats();
        
        expect(stats.totalStages).toBe(2);
        expect(stats.totalDistance).toBe(35.5);
        expect(stats.totalElevationGain).toBe(2050);
        expect(stats.totalElevationLoss).toBe(1250);
        expect(stats.difficulties.simple).toBe(1);
        expect(stats.difficulties.moyenne).toBe(1);
    });

    it('should search stages by criteria', () => {
        const mockStages = [
            { 
                from: 'Hendaye', 
                to: 'Col d\'Ibardin', 
                terrain: 'forêt',
                refuge: 'Gîte Ibardin'
            },
            { 
                from: 'Col d\'Ibardin', 
                to: 'Bidarray', 
                terrain: 'montagne',
                refuge: 'Refuge Bidarray'
            }
        ];
        
        dataManager.stages = mockStages;
        
        const forestResults = dataManager.searchStages('forêt');
        expect(forestResults).toHaveLength(1);
        expect(forestResults[0].from).toBe('Hendaye');
        
        const bidResults = dataManager.searchStages('bid');
        expect(bidResults).toHaveLength(1);
        expect(bidResults[0].to).toBe('Bidarray');
    });

    it('should validate stage structure', () => {
        const validStage = {
            day: 1,
            date: '2025-09-08',
            from: 'Hendaye',
            to: 'Col d\'Ibardin',
            distance: '15 km',
            elevation: '+850m / -450m',
            duration: '6h'
        };
        
        const invalidStage = {
            day: 1,
            from: 'Hendaye'
            // Champs manquants
        };
        
        expect(dataManager.validateStage(validStage)).toBeTruthy();
        expect(dataManager.validateStage(invalidStage)).toBeFalsy();
    });

    it('should export data as JSON', () => {
        const mockStages = [
            { day: 1, from: 'A', to: 'B' }
        ];
        
        dataManager.stages = mockStages;
        
        const exported = dataManager.exportData();
        const parsed = JSON.parse(exported);
        
        expect(parsed).toEqual(mockStages);
    });
});
