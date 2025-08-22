/**
 * Application principale GR10 - Point d'entrée unifié
 * Gère l'initialisation et la coordination des modules
 */
class GR10Application {
    constructor() {
        this.mode = this.detectMode();
        this.isInitialized = false;
        this.modules = {};
        
        this.init();
    }

    /**
     * Détecte le mode de l'application (admin ou public)
     */
    detectMode() {
        const path = window.location.pathname;
        return path.includes('public') ? 'public' : 'admin';
    }

    /**
     * Initialise l'application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            console.log(`🚀 Initialisation GR10 App (mode: ${this.mode})`);
            
            // Attendre que le DOM soit prêt
            await this.waitForDOM();
            
            // Charger les données
            await this.loadData();
            
            // Initialiser les modules core
            await this.initCoreModules();
            
            // Initialiser les composants
            await this.initComponents();
            
            // Initialiser la vue selon le mode
            await this.initView();
            
            // Configurer les event listeners globaux
            this.setupGlobalListeners();
            
            this.isInitialized = true;
            console.log('✅ Application GR10 initialisée avec succès');
            
            // Déclencher l'événement d'initialisation
            window.dispatchEvent(new CustomEvent('gr10AppReady', {
                detail: { mode: this.mode }
            }));
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
        }
    }

    /**
     * Attend que le DOM soit prêt
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Charge les données de l'application
     */
    async loadData() {
        if (!window.dataManager) {
            throw new Error('DataManager non disponible');
        }
        
        await window.dataManager.loadStages();
        console.log('📊 Données chargées');
    }

    /**
     * Initialise les modules core
     */
    async initCoreModules() {
        // Vérifier que les managers sont disponibles
        if (!window.storageManager) {
            throw new Error('StorageManager non disponible');
        }
        
        if (!window.themeManager) {
            throw new Error('ThemeManager non disponible');
        }
        
        console.log('🔧 Modules core initialisés');
    }

    /**
     * Initialise les composants
     */
    async initComponents() {
        // Initialiser le gestionnaire de progression
        this.modules.progress = new ProgressManager();
        
        // Initialiser le gestionnaire de modal selon le mode
        if (this.mode === 'admin') {
            this.modules.modal = window.modalManager || new AdminModalManager();
        } else {
            this.modules.modal = window.publicModalManager || new PublicModalManager();
        }
        
        console.log('🧩 Composants initialisés');
    }

    /**
     * Initialise la vue selon le mode
     */
    async initView() {
        const container = document.getElementById('stages-container');
        if (!container) {
            throw new Error('Container stages-container non trouvé');
        }

        const stages = window.dataManager.getAllStages();
        if (!stages.length) {
            throw new Error('Aucune étape disponible');
        }

        // Rendre les cartes d'étapes
        this.renderStageCards(container, stages);
        
        // Initialiser les vues spécifiques
        if (this.mode === 'public') {
            await this.initPublicFeatures();
        } else {
            await this.initAdminFeatures();
        }
        
        console.log(`🎨 Vue ${this.mode} initialisée`);
    }

    /**
     * Rend les cartes d'étapes
     */
    renderStageCards(container, stages) {
        container.innerHTML = '';
        
        stages.forEach(stage => {
            const options = {
                mode: this.mode,
                showActions: this.mode === 'admin',
                showProgress: true
            };
            
            StageCard.createAndAttach(stage, container, options);
        });
        
        console.log(`📋 ${stages.length} cartes d'étapes rendues`);
    }

    /**
     * Initialise les fonctionnalités publiques
     */
    async initPublicFeatures() {
        // Initialiser la navigation par sections
        if (window.commentsOverview) {
            this.modules.navigation = window.commentsOverview;
        }
        
        // Initialiser les analytics
        if (window.analytics) {
            this.modules.analytics = window.analytics;
        }
        
        // Initialiser l'overview des commentaires
        if (window.commentsOverview) {
            this.modules.commentsOverview = window.commentsOverview;
        }
    }

    /**
     * Initialise les fonctionnalités admin
     */
    async initAdminFeatures() {
        // Mettre à jour les statistiques de progression
        this.modules.progress.updateProgressDashboard();
    }

    /**
     * Configure les event listeners globaux
     */
    setupGlobalListeners() {
        // Écouter les changements de progression
        window.addEventListener('stageProgressChanged', (e) => {
            this.modules.progress.updateProgressDashboard();
        });
        
        // Écouter les changements de thème
        window.addEventListener('themeChanged', (e) => {
            // Recharger les graphiques si nécessaire
            if (this.modules.analytics) {
                this.modules.analytics.loadAnalytics();
            }
        });
        
        // Gestion des erreurs globales
        window.addEventListener('error', (e) => {
            console.error('❌ Erreur globale:', e.error);
        });
    }

    /**
     * Recharge les données et met à jour l'affichage
     */
    async refresh() {
        try {
            await this.loadData();
            
            const container = document.getElementById('stages-container');
            const stages = window.dataManager.getAllStages();
            
            this.renderStageCards(container, stages);
            this.modules.progress.updateProgressDashboard();
            
            console.log('🔄 Application rechargée');
        } catch (error) {
            console.error('❌ Erreur lors du rechargement:', error);
        }
    }

    /**
     * Retourne les statistiques de l'application
     */
    getStats() {
        return {
            mode: this.mode,
            initialized: this.isInitialized,
            stages: window.dataManager.getAllStages().length,
            modules: Object.keys(this.modules),
            theme: window.themeManager.getCurrentTheme()
        };
    }

    /**
     * Nettoie l'application
     */
    destroy() {
        // Nettoyer les modules
        Object.values(this.modules).forEach(module => {
            if (module.destroy) {
                module.destroy();
            }
        });
        
        this.modules = {};
        this.isInitialized = false;
        
        console.log('🧹 Application nettoyée');
    }
}

/**
 * Gestionnaire de progression simplifié
 */
class ProgressManager {
    updateProgressDashboard() {
        const stats = window.storageManager.getProgressStats();
        const globalStats = window.dataManager.getGlobalStats();
        
        // Mettre à jour les éléments du DOM
        this.updateElement('completed-stages', stats.completed);
        this.updateElement('remaining-stages', stats.remaining);
        this.updateElement('completion-percentage', `${stats.percentage}%`);
        
        if (globalStats) {
            this.updateElement('total-distance', `${globalStats.totalDistance} km`);
            this.updateElement('total-elevation-positive', `${globalStats.totalElevationGain} m`);
            this.updateElement('total-elevation-negative', `${globalStats.totalElevationLoss} m`);
        }
        
        // Mettre à jour la barre de progression
        const progressBar = document.getElementById('progress-fill');
        if (progressBar) {
            progressBar.style.width = `${stats.percentage}%`;
        }
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

/**
 * Gestionnaires de modal simplifiés
 */
class AdminModalManager {
    constructor() {
        // Utiliser le modal existant pour le moment
        if (window.modalManager) {
            return window.modalManager;
        }
    }
}

class PublicModalManager {
    constructor() {
        // Utiliser le modal public existant pour le moment
        if (window.publicModalManager) {
            return window.publicModalManager;
        }
    }
}

/**
 * Navigateur de sections pour la version publique
 */
class SectionNavigator {
    constructor() {
        this.setupNavigation();
    }
    
    setupNavigation() {
        // Utiliser le système existant pour le moment
        if (window.commentsOverview) {
            return;
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the dashboard first (for compatibility)
    window.dashboard = new GR10Dashboard();
    
    // Then initialize the modular application
    window.gr10App = new GR10Application();
});
