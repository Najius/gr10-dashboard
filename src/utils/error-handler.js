/**
 * Gestionnaire d'erreurs centralisé pour l'application GR10
 * Fournit une gestion uniforme des erreurs avec logging et notifications
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupGlobalHandlers();
    }

    /**
     * Configure les gestionnaires d'erreurs globaux
     */
    setupGlobalHandlers() {
        // Erreurs JavaScript non capturées
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Promesses rejetées non capturées
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Erreurs de ressources (images, scripts, etc.)
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);
    }

    /**
     * Traite une erreur
     */
    handleError(error) {
        // Ajouter au log
        this.addToLog(error);

        // Logger en console selon le niveau
        this.logToConsole(error);

        // Notifier l'utilisateur si nécessaire
        if (this.shouldNotifyUser(error)) {
            this.notifyUser(error);
        }

        // Envoyer les métriques (si configuré)
        this.sendMetrics(error);
    }

    /**
     * Ajoute une erreur au log interne
     */
    addToLog(error) {
        this.errorLog.unshift({
            id: this.generateErrorId(),
            ...error,
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // Limiter la taille du log
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // Sauvegarder dans localStorage pour debug
        try {
            localStorage.setItem('gr10-error-log', JSON.stringify(this.errorLog.slice(0, 10)));
        } catch (e) {
            // Ignorer les erreurs de localStorage
        }
    }

    /**
     * Log l'erreur en console
     */
    logToConsole(error) {
        const prefix = `[GR10 Error - ${error.type}]`;
        
        switch (error.severity || 'error') {
            case 'warning':
                console.warn(prefix, error.message, error);
                break;
            case 'info':
                console.info(prefix, error.message, error);
                break;
            default:
                console.error(prefix, error.message, error);
        }
    }

    /**
     * Détermine si l'utilisateur doit être notifié
     */
    shouldNotifyUser(error) {
        // Ne pas notifier pour les erreurs de ressources mineures
        if (error.type === 'resource' && error.message.includes('favicon')) {
            return false;
        }

        // Ne pas notifier pour les erreurs de développement
        if (window.location.hostname === 'localhost') {
            return false;
        }

        return error.severity !== 'info';
    }

    /**
     * Notifie l'utilisateur de l'erreur
     */
    notifyUser(error) {
        const message = this.getUserFriendlyMessage(error);
        
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            // Fallback: créer une notification simple
            this.createSimpleNotification(message);
        }
    }

    /**
     * Crée une notification simple
     */
    createSimpleNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button class="error-notification-close">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto-remove après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Bouton de fermeture
        notification.querySelector('.error-notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Génère un message convivial pour l'utilisateur
     */
    getUserFriendlyMessage(error) {
        switch (error.type) {
            case 'javascript':
                return 'Une erreur technique s\'est produite. L\'équipe a été notifiée.';
            case 'promise':
                return 'Une opération a échoué. Veuillez réessayer.';
            case 'resource':
                return 'Impossible de charger certaines ressources. Vérifiez votre connexion.';
            case 'network':
                return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
            case 'validation':
                return error.message || 'Données invalides détectées.';
            default:
                return 'Une erreur inattendue s\'est produite.';
        }
    }

    /**
     * Envoie les métriques d'erreur (placeholder)
     */
    sendMetrics(error) {
        // TODO: Implémenter l'envoi vers un service d'analytics
        // Exemple: Google Analytics, Sentry, etc.
    }

    /**
     * Génère un ID unique pour l'erreur
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * API publique pour logger des erreurs personnalisées
     */
    logError(message, type = 'custom', severity = 'error', context = {}) {
        this.handleError({
            type,
            message,
            severity,
            context,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * API publique pour logger des avertissements
     */
    logWarning(message, context = {}) {
        this.logError(message, 'warning', 'warning', context);
    }

    /**
     * API publique pour logger des informations
     */
    logInfo(message, context = {}) {
        this.logError(message, 'info', 'info', context);
    }

    /**
     * Récupère les erreurs récentes
     */
    getRecentErrors(limit = 10) {
        return this.errorLog.slice(0, limit);
    }

    /**
     * Efface le log d'erreurs
     */
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('gr10-error-log');
    }

    /**
     * Exporte le log d'erreurs
     */
    exportErrorLog() {
        const data = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            errors: this.errorLog
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gr10-error-log-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Instance globale
window.errorHandler = new ErrorHandler();

// API globale simplifiée
window.logError = (message, context) => window.errorHandler.logError(message, 'custom', 'error', context);
window.logWarning = (message, context) => window.errorHandler.logWarning(message, context);
window.logInfo = (message, context) => window.errorHandler.logInfo(message, context);
