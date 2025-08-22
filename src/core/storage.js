/**
 * Gestionnaire centralisé du stockage localStorage
 * Interface unifiée pour toutes les données persistantes
 */
class StorageManager {
    constructor() {
        this.prefix = 'gr10_';
        this.keys = {
            // Progression des étapes
            stageCompleted: 'stage_completed_',
            stageNotes: 'stage_notes_',
            stagePhotos: 'stage_photos_',
            stageRating: 'stage_rating_',
            
            // Commentaires
            stageComments: 'stage_comments_',
            visitorComments: 'visitor_comments_',
            
            // Préférences
            theme: 'theme',
            lastVisit: 'last_visit',
            
            // Cache
            progressStats: 'progress_stats',
            lastUpdate: 'last_update'
        };
    }

    /**
     * Génère une clé avec préfixe
     */
    _getKey(key, suffix = '') {
        return `${this.prefix}${key}${suffix}`;
    }

    /**
     * Sauvegarde une valeur
     */
    set(key, value, suffix = '') {
        try {
            const fullKey = this._getKey(key, suffix);
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error('❌ Erreur de sauvegarde:', error);
            return false;
        }
    }

    /**
     * Récupère une valeur
     */
    get(key, suffix = '', defaultValue = null) {
        try {
            const fullKey = this._getKey(key, suffix);
            const value = localStorage.getItem(fullKey);
            
            if (value === null) return defaultValue;
            
            // Tenter de parser en JSON, sinon retourner la string
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error('❌ Erreur de lecture:', error);
            return defaultValue;
        }
    }

    /**
     * Supprime une valeur
     */
    remove(key, suffix = '') {
        try {
            const fullKey = this._getKey(key, suffix);
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('❌ Erreur de suppression:', error);
            return false;
        }
    }

    /**
     * Vérifie si une clé existe
     */
    has(key, suffix = '') {
        const fullKey = this._getKey(key, suffix);
        return localStorage.getItem(fullKey) !== null;
    }

    // === MÉTHODES SPÉCIALISÉES ===

    /**
     * Gestion de la progression des étapes
     */
    setStageCompleted(day, completed = true) {
        return this.set(this.keys.stageCompleted, completed, day);
    }

    isStageCompleted(day) {
        return this.get(this.keys.stageCompleted, day, false);
    }

    getCompletedStages() {
        const completed = [];
        for (let i = 1; i <= 48; i++) {
            if (this.isStageCompleted(i)) {
                completed.push(i);
            }
        }
        return completed;
    }

    /**
     * Gestion des notes d'étapes
     */
    setStageNotes(day, notes) {
        return this.set(this.keys.stageNotes, notes, day);
    }

    getStageNotes(day) {
        return this.get(this.keys.stageNotes, day, '');
    }

    /**
     * Gestion des photos d'étapes
     */
    setStagePhotos(day, photos) {
        return this.set(this.keys.stagePhotos, photos, day);
    }

    getStagePhotos(day) {
        return this.get(this.keys.stagePhotos, day, []);
    }

    addStagePhoto(day, photoData) {
        const photos = this.getStagePhotos(day);
        photos.push(photoData);
        return this.setStagePhotos(day, photos);
    }

    /**
     * Gestion des évaluations d'étapes
     */
    setStageRating(day, rating) {
        return this.set(this.keys.stageRating, rating, day);
    }

    getStageRating(day) {
        return this.get(this.keys.stageRating, day, 0);
    }

    /**
     * Gestion des commentaires visiteurs
     */
    setStageComments(day, comments) {
        return this.set(this.keys.stageComments, comments, day);
    }

    getStageComments(day) {
        return this.get(this.keys.stageComments, day, []);
    }

    addStageComment(day, comment) {
        const comments = this.getStageComments(day);
        const newComment = {
            id: Date.now(),
            text: comment,
            date: new Date().toISOString(),
            author: 'Visiteur'
        };
        comments.push(newComment);
        return this.setStageComments(day, comments);
    }

    getAllComments() {
        const allComments = {};
        for (let i = 1; i <= 48; i++) {
            const comments = this.getStageComments(i);
            if (comments.length > 0) {
                allComments[i] = comments;
            }
        }
        return allComments;
    }

    /**
     * Gestion du thème
     */
    setTheme(theme) {
        return this.set(this.keys.theme, theme);
    }

    getTheme() {
        return this.get(this.keys.theme, '', 'light');
    }

    /**
     * Statistiques de progression
     */
    getProgressStats() {
        const completed = this.getCompletedStages();
        const total = 48;
        
        return {
            completed: completed.length,
            remaining: total - completed.length,
            percentage: Math.round((completed.length / total) * 100),
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Nettoyage et maintenance
     */
    clearStageData(day) {
        this.remove(this.keys.stageCompleted, day);
        this.remove(this.keys.stageNotes, day);
        this.remove(this.keys.stagePhotos, day);
        this.remove(this.keys.stageRating, day);
        this.remove(this.keys.stageComments, day);
    }

    clearAllData() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Export/Import des données
     */
    exportAllData() {
        const data = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                data[key] = localStorage.getItem(key);
            }
        });
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.entries(data).forEach(([key, value]) => {
                if (key.startsWith(this.prefix)) {
                    localStorage.setItem(key, value);
                }
            });
            return true;
        } catch (error) {
            console.error('❌ Erreur d\'import:', error);
            return false;
        }
    }
}

// Instance globale
window.storageManager = new StorageManager();
