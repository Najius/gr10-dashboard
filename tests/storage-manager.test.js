/**
 * Tests pour StorageManager
 */
describe('StorageManager', () => {
    let storageManager;

    beforeEach(() => {
        // Nettoyer localStorage avant chaque test
        localStorage.clear();
        storageManager = new StorageManager();
    });

    it('should initialize correctly', () => {
        expect(storageManager).toBeInstanceOf(StorageManager);
        expect(storageManager.prefix).toBe('gr10-');
        expect(storageManager.cache).toBeInstanceOf(Map);
    });

    it('should set and get values correctly', () => {
        const testData = { name: 'Test Stage', distance: 15 };
        
        const success = storageManager.set('test-stage', testData);
        expect(success).toBeTruthy();
        
        const retrieved = storageManager.get('test-stage');
        expect(retrieved).toEqual(testData);
    });

    it('should return default value when key does not exist', () => {
        const result = storageManager.get('non-existent', 'default');
        expect(result).toBe('default');
    });

    it('should manage completed stages', () => {
        // Ajouter des étapes complétées
        storageManager.completeStage(1);
        storageManager.completeStage(2);
        
        expect(storageManager.isStageCompleted(1)).toBeTruthy();
        expect(storageManager.isStageCompleted(2)).toBeTruthy();
        expect(storageManager.isStageCompleted(3)).toBeFalsy();
        
        // Annuler une étape
        storageManager.uncompleteStage(1);
        expect(storageManager.isStageCompleted(1)).toBeFalsy();
    });

    it('should calculate progress stats correctly', () => {
        storageManager.completeStage(1);
        storageManager.completeStage(2);
        storageManager.completeStage(3);
        
        const stats = storageManager.getProgressStats();
        expect(stats.completed).toBe(3);
        expect(stats.remaining).toBe(45);
        expect(stats.total).toBe(48);
        expect(stats.percentage).toBe(6); // 3/48 * 100 = 6.25 -> 6
    });

    it('should manage stage notes', () => {
        const notes = 'Belle étape avec vue magnifique';
        
        storageManager.setStageNotes(1, notes);
        const retrieved = storageManager.getStageNotes(1);
        
        expect(retrieved).toBe(notes);
        expect(storageManager.getStageNotes(999)).toBe('');
    });

    it('should manage stage ratings', () => {
        storageManager.setStageRating(1, 5);
        expect(storageManager.getStageRating(1)).toBe(5);
        expect(storageManager.getStageRating(999)).toBe(0);
    });

    it('should manage theme settings', () => {
        expect(storageManager.getTheme()).toBe('light');
        
        storageManager.setTheme('dark');
        expect(storageManager.getTheme()).toBe('dark');
    });

    it('should export and import data correctly', () => {
        // Ajouter des données de test
        storageManager.completeStage(1);
        storageManager.setStageNotes(1, 'Test note');
        storageManager.setTheme('dark');
        
        // Exporter
        const exported = storageManager.exportData();
        expect(exported).toBeTruthy();
        expect(exported.data).toBeTruthy();
        expect(exported.timestamp).toBeTruthy();
        
        // Nettoyer et importer
        storageManager.clear();
        expect(storageManager.isStageCompleted(1)).toBeFalsy();
        
        const success = storageManager.importData(exported);
        expect(success).toBeTruthy();
        expect(storageManager.isStageCompleted(1)).toBeTruthy();
        expect(storageManager.getStageNotes(1)).toBe('Test note');
        expect(storageManager.getTheme()).toBe('dark');
    });

    it('should handle localStorage unavailability gracefully', () => {
        // Simuler l'indisponibilité de localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => { throw new Error('Storage unavailable'); };
        
        const newManager = new StorageManager();
        expect(newManager.isAvailable).toBeFalsy();
        
        // Devrait utiliser le cache
        const success = newManager.set('test', 'value');
        expect(success).toBeTruthy();
        
        const retrieved = newManager.get('test');
        expect(retrieved).toBe('value');
        
        // Restaurer localStorage
        localStorage.setItem = originalSetItem;
    });
});
