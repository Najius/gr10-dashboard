/**
 * Gestionnaire de stockage centralisé avec gestion d'erreur robuste
 * Gère localStorage avec fallbacks et validation
 */
class StorageManager {
    constructor() {
        this.prefix = 'gr10-';
        this.isAvailable = this.checkStorageAvailability();
        this.cache = new Map();
    }

    /**
     * Vérifie la disponibilité de localStorage
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logWarning('localStorage non disponible, utilisation du cache mémoire', {
                    error: error.message
                });
            }
            return false;
        }
    }

    /**
     * Génère une clé avec préfixe
     */
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Sauvegarde une valeur
     */
    set(key, value) {
        const fullKey = this.getKey(key);
        
        try {
            const serializedValue = JSON.stringify(value);
            
            if (this.isAvailable) {
                localStorage.setItem(fullKey, serializedValue);
            }
            
            // Toujours mettre en cache
            this.cache.set(fullKey, value);
            
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(
                    `Erreur lors de la sauvegarde: ${error.message}`,
                    'storage',
                    'error',
                    { key, error: error.stack }
                );
            }
            return false;
        }
    }

    /**
     * Récupère une valeur
     */
    get(key, defaultValue = null) {
        const fullKey = this.getKey(key);
        
        try {
            // Vérifier d'abord le cache
            if (this.cache.has(fullKey)) {
                return this.cache.get(fullKey);
            }
            
            // Puis localStorage si disponible
            if (this.isAvailable) {
                const item = localStorage.getItem(fullKey);
                if (item !== null) {
                    const parsed = JSON.parse(item);
                    this.cache.set(fullKey, parsed);
                    return parsed;
                }
            }
            
            return defaultValue;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(
                    `Erreur lors de la récupération: ${error.message}`,
                    'storage',
                    'error',
                    { key, error: error.stack }
                );
            }
            return defaultValue;
        }
    }

    /**
     * Supprime une valeur
     */
    remove(key) {
        const fullKey = this.getKey(key);
        
        try {
            if (this.isAvailable) {
                localStorage.removeItem(fullKey);
            }
            this.cache.delete(fullKey);
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(
                    `Erreur lors de la suppression: ${error.message}`,
                    'storage',
                    'error',
                    { key, error: error.stack }
                );
            }
            return false;
        }
    }

    /**
     * Efface toutes les données GR10
     */
    clear() {
        try {
            if (this.isAvailable) {
                const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
                keys.forEach(key => localStorage.removeItem(key));
            }
            
            // Effacer le cache
            for (const key of this.cache.keys()) {
                if (key.startsWith(this.prefix)) {
                    this.cache.delete(key);
                }
            }
            
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(
                    `Erreur lors de l'effacement: ${error.message}`,
                    'storage',
                    'error',
                    { error: error.stack }
                );
            }
            return false;
        }
    }

    /**
     * Gestion spécifique des étapes complétées
     */
    getCompletedStages() {
        return new Set(this.get('completed-stages', []));
    }

    setCompletedStages(stages) {
        const stagesArray = Array.isArray(stages) ? stages : Array.from(stages);
        return this.set('completed-stages', stagesArray);
    }

    isStageCompleted(stageId) {
        const completed = this.getCompletedStages();
        return completed.has(stageId);
    }

    completeStage(stageId) {
        const completed = this.getCompletedStages();
        completed.add(stageId);
        return this.setCompletedStages(completed);
    }

    uncompleteStage(stageId) {
        const completed = this.getCompletedStages();
        completed.delete(stageId);
        return this.setCompletedStages(completed);
    }

    /**
     * Gestion des notes d'étapes
     */
    getStageNotes(stageId) {
        const allNotes = this.get('stage-notes', {});
        return allNotes[stageId] || '';
    }

    setStageNotes(stageId, notes) {
        const allNotes = this.get('stage-notes', {});
        allNotes[stageId] = notes;
        return this.set('stage-notes', allNotes);
    }

    /**
     * Gestion des évaluations
     */
    getStageRating(stageId) {
        const allRatings = this.get('stage-ratings', {});
        return allRatings[stageId] || 0;
    }

    setStageRating(stageId, rating) {
        const allRatings = this.get('stage-ratings', {});
        allRatings[stageId] = rating;
        return this.set('stage-ratings', allRatings);
    }

    /**
     * Gestion des photos
     */
    getStagePhotos(stageId) {
        const allPhotos = this.get('stage-photos', {});
        return allPhotos[stageId] || [];
    }

    setStagePhotos(stageId, photos) {
        const allPhotos = this.get('stage-photos', {});
        allPhotos[stageId] = photos;
        return this.set('stage-photos', allPhotos);
    }

    /**
     * Gestion du thème
     */
    getTheme() {
        return this.get('theme', 'light');
    }

    setTheme(theme) {
        return this.set('theme', theme);
    }

    /**
     * Gestion du mode admin
     */
    getAdminMode() {
        return this.get('admin-mode', false);
    }

    setAdminMode(isAdmin) {
        return this.set('admin-mode', isAdmin);
    }

    /**
     * Statistiques de progression
     */
    getProgressStats() {
        const completed = this.getCompletedStages();
        const total = 48; // Nombre total d'étapes GR10
        
        return {
            completed: completed.size,
            remaining: total - completed.size,
            total: total,
            percentage: Math.round((completed.size / total) * 100)
        };
    }

    /**
     * Export des données
     */
    exportData() {
        const data = {};
        
        try {
            if (this.isAvailable) {
                const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
                keys.forEach(key => {
                    data[key.replace(this.prefix, '')] = JSON.parse(localStorage.getItem(key));
                });
            } else {
                // Utiliser le cache
                for (const [key, value] of this.cache.entries()) {
                    if (key.startsWith(this.prefix)) {
                        data[key.replace(this.prefix, '')] = value;
                    }
                }
            }
            
            return {
                timestamp: new Date().toISOString(),
                data: data
            };
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(
                    `Erreur lors de l'export: ${error.message}`,
                    'storage',
                    'error',
                    { error: error.stack }
                );
            }
            return null;
        }
    }

    /**
     * Import des données
     */
    importData(exportedData) {
        try {
            if (!exportedData || !exportedData.data) {
                throw new Error('Format de données invalide');
            }
            
            Object.entries(exportedData.data).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError(
                    `Erreur lors de l'import: ${error.message}`,
                    'storage',
                    'error',
                    { error: error.stack }
                );
            }
            return false;
        }
    }
}

// Instance globale
window.storageManager = new StorageManager();
