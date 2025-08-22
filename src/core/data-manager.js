/**
 * Gestionnaire centralisé des données GR10
 * Point unique d'accès aux données des étapes
 */
class DataManager {
    constructor() {
        this.stages = [];
        this.isLoaded = false;
    }

    /**
     * Charge les données des étapes
     */
    async loadStages() {
        if (this.isLoaded) return this.stages;

        try {
            // Utiliser les données intégrées depuis window.itineraryData
            if (window.itineraryData && Array.isArray(window.itineraryData)) {
                this.stages = window.itineraryData;
                this.isLoaded = true;
                console.log(`✅ ${this.stages.length} étapes chargées`);
                return this.stages;
            }

            // Fallback: essayer de charger depuis JSON
            const response = await fetch('./data/gr10-stages.json');
            if (response.ok) {
                this.stages = await response.json();
                this.isLoaded = true;
                console.log(`✅ ${this.stages.length} étapes chargées depuis JSON`);
                return this.stages;
            }

            throw new Error('Aucune source de données disponible');
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            this.stages = [];
            return this.stages;
        }
    }

    /**
     * Récupère toutes les étapes
     */
    getAllStages() {
        return this.stages;
    }

    /**
     * Récupère une étape par son numéro de jour
     */
    getStageByDay(day) {
        return this.stages.find(stage => stage.day === parseInt(day));
    }

    /**
     * Récupère les étapes par difficulté
     */
    getStagesByDifficulty(difficulty) {
        return this.stages.filter(stage => 
            stage.difficulty?.toLowerCase() === difficulty.toLowerCase()
        );
    }

    /**
     * Calcule les statistiques globales
     */
    getGlobalStats() {
        if (!this.stages.length) return null;

        const stats = {
            totalStages: this.stages.length,
            totalDistance: 0,
            totalElevationGain: 0,
            totalElevationLoss: 0,
            difficulties: {
                simple: 0,
                moyenne: 0,
                difficile: 0
            }
        };

        this.stages.forEach(stage => {
            // Extraire la distance (ex: "15 km" -> 15)
            const distanceMatch = stage.distance?.match(/(\d+(?:\.\d+)?)/);
            if (distanceMatch) {
                stats.totalDistance += parseFloat(distanceMatch[1]);
            }

            // Extraire les dénivelés (ex: "+850m / -450m")
            const elevationMatch = stage.elevation?.match(/\+(\d+)m.*-(\d+)m/);
            if (elevationMatch) {
                stats.totalElevationGain += parseInt(elevationMatch[1]);
                stats.totalElevationLoss += parseInt(elevationMatch[2]);
            }

            // Compter les difficultés
            const difficulty = stage.difficulty?.toLowerCase();
            if (stats.difficulties.hasOwnProperty(difficulty)) {
                stats.difficulties[difficulty]++;
            }
        });

        return stats;
    }

    /**
     * Recherche d'étapes par critères
     */
    searchStages(criteria) {
        return this.stages.filter(stage => {
            const searchText = criteria.toLowerCase();
            return (
                stage.from?.toLowerCase().includes(searchText) ||
                stage.to?.toLowerCase().includes(searchText) ||
                stage.terrain?.toLowerCase().includes(searchText) ||
                stage.refuge?.toLowerCase().includes(searchText)
            );
        });
    }

    /**
     * Valide la structure d'une étape
     */
    validateStage(stage) {
        const required = ['day', 'date', 'from', 'to', 'distance', 'elevation', 'duration'];
        return required.every(field => stage.hasOwnProperty(field) && stage[field]);
    }

    /**
     * Exporte les données au format JSON
     */
    exportData() {
        return JSON.stringify(this.stages, null, 2);
    }
}

// Instance globale
window.dataManager = new DataManager();
