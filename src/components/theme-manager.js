/**
 * Gestionnaire de thème unifié
 * Gère le basculement entre mode clair et sombre
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.toggleButtons = [];
        this.init();
    }

    /**
     * Initialise le gestionnaire de thème
     */
    init() {
        this.loadSavedTheme();
        this.setupToggleButtons();
        this.applyTheme(this.currentTheme);
    }

    /**
     * Charge le thème sauvegardé
     */
    loadSavedTheme() {
        this.currentTheme = window.storageManager?.getTheme() || 'light';
    }

    /**
     * Configure les boutons de basculement
     */
    setupToggleButtons() {
        // Rechercher tous les boutons de thème
        const buttons = document.querySelectorAll('[data-theme-toggle], #theme-toggle, #admin-theme-toggle');
        
        buttons.forEach(button => {
            this.toggleButtons.push(button);
            button.addEventListener('click', () => this.toggleTheme());
        });

        this.updateToggleIcons();
    }

    /**
     * Bascule entre les thèmes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Définit un thème spécifique
     */
    setTheme(theme) {
        if (!['light', 'dark'].includes(theme)) {
            console.warn(`❌ Thème invalide: ${theme}`);
            return;
        }

        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        this.updateToggleIcons();
        
        // Déclencher un événement pour les composants qui en ont besoin
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    }

    /**
     * Applique le thème au document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Ajouter une classe pour les transitions
        document.body.classList.add('theme-transitioning');
        
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
    }

    /**
     * Sauvegarde le thème
     */
    saveTheme(theme) {
        window.storageManager?.setTheme(theme);
    }

    /**
     * Met à jour les icônes des boutons de basculement
     */
    updateToggleIcons() {
        this.toggleButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (!icon) return;

            if (this.currentTheme === 'dark') {
                icon.className = 'fas fa-sun';
                button.setAttribute('title', 'Basculer vers le mode clair');
            } else {
                icon.className = 'fas fa-moon';
                button.setAttribute('title', 'Basculer vers le mode sombre');
            }
        });
    }

    /**
     * Retourne le thème actuel
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Vérifie si le mode sombre est actif
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    /**
     * Détecte la préférence système
     */
    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Utilise la préférence système
     */
    useSystemPreference() {
        const systemTheme = this.getSystemPreference();
        this.setTheme(systemTheme);
    }

    /**
     * Écoute les changements de préférence système
     */
    watchSystemPreference() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                const newTheme = e.matches ? 'dark' : 'light';
                this.setTheme(newTheme);
            });
        }
    }

    /**
     * Ajoute un nouveau bouton de basculement
     */
    addToggleButton(button) {
        if (!this.toggleButtons.includes(button)) {
            this.toggleButtons.push(button);
            button.addEventListener('click', () => this.toggleTheme());
            this.updateToggleIcons();
        }
    }

    /**
     * Supprime un bouton de basculement
     */
    removeToggleButton(button) {
        const index = this.toggleButtons.indexOf(button);
        if (index > -1) {
            this.toggleButtons.splice(index, 1);
        }
    }

    /**
     * Réinitialise le thème
     */
    reset() {
        this.setTheme('light');
    }

    /**
     * Configuration avancée du thème
     */
    configure(options = {}) {
        const {
            autoDetectSystem = false,
            watchSystemChanges = false,
            transitionDuration = 300
        } = options;

        if (autoDetectSystem) {
            this.useSystemPreference();
        }

        if (watchSystemChanges) {
            this.watchSystemPreference();
        }

        if (transitionDuration !== 300) {
            document.documentElement.style.setProperty(
                '--theme-transition-duration', 
                `${transitionDuration}ms`
            );
        }
    }
}

// Instance globale
window.themeManager = new ThemeManager();

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager.init();
    });
} else {
    window.themeManager.init();
}
