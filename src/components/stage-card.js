/**
 * Composant StageCard - Gestion unifiée des cartes d'étapes
 * Supporte les modes admin et public
 */
class StageCard {
    constructor(stage, options = {}) {
        this.stage = stage;
        this.options = {
            mode: 'admin', // 'admin' ou 'public'
            showActions: true,
            showProgress: true,
            ...options
        };
    }

    /**
     * Génère le HTML de la carte d'étape
     */
    render() {
        const isCompleted = window.storageManager?.isStageCompleted(this.stage.day) || false;
        const difficultyClass = this.getDifficultyClass(this.stage.difficulty);
        const statusBadge = this.createStatusBadge(isCompleted);

        return `
            <div class="stage-card ${isCompleted ? 'completed' : ''} ${difficultyClass}" 
                 data-day="${this.stage.day}">
                ${statusBadge}
                ${this.createHeader()}
                ${this.createBody()}
                ${this.options.showActions ? this.createActions() : ''}
            </div>
        `;
    }

    /**
     * Crée le badge de statut
     */
    createStatusBadge(isCompleted) {
        if (!this.options.showProgress) return '';

        return `
            <div class="stage-status ${isCompleted ? 'completed' : 'pending'}">
                <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-clock'}"></i>
                <span>${isCompleted ? 'Terminée' : ''}</span>
            </div>
        `;
    }

    /**
     * Crée l'en-tête de la carte
     */
    createHeader() {
        return `
            <div class="stage-card-header">
                <div class="stage-number">${this.stage.day}</div>
                <div class="stage-title">
                    <h3>${this.stage.from} → ${this.stage.to}</h3>
                    <div class="stage-date">${this.stage.date}</div>
                </div>
            </div>
        `;
    }

    /**
     * Crée le corps de la carte avec les statistiques
     */
    createBody() {
        return `
            <div class="stage-card-body">
                <div class="stage-info-row">
                    <div class="stage-stats">
                        ${this.createStat('fas fa-route', this.stage.distance)}
                        ${this.createStat('fas fa-mountain', this.stage.elevation)}
                        ${this.createStat('fas fa-clock', this.stage.duration)}
                        ${this.createStat(this.getDifficultyIcon(this.stage.difficulty), 
                                         `<span class="difficulty-badge">${this.stage.difficulty}</span>`)}
                    </div>
                    ${this.options.showActions ? this.createViewButton() : ''}
                </div>
            </div>
        `;
    }

    /**
     * Crée une statistique individuelle
     */
    createStat(icon, value) {
        return `
            <div class="stat">
                <i class="${icon}"></i>
                <span>${value}</span>
            </div>
        `;
    }

    /**
     * Crée le bouton "Voir les détails"
     */
    createViewButton() {
        const clickHandler = this.options.mode === 'admin' 
            ? `openStageModal(${this.stage.day})`
            : `openPublicStageModal(${this.stage.day})`;

        return `
            <button class="btn btn-outline view-details-btn" onclick="${clickHandler}">
                <i class="fas fa-eye"></i>
                Voir les détails
            </button>
        `;
    }

    /**
     * Crée les actions spécifiques au mode admin
     */
    createActions() {
        // Actions supprimées - validation maintenant dans la modal
        return '';
    }

    /**
     * Retourne la classe CSS pour la difficulté
     */
    getDifficultyClass(difficulty) {
        const difficultyMap = {
            'simple': 'difficulty-easy',
            'moyenne': 'difficulty-medium',
            'difficile': 'difficulty-hard'
        };
        return difficultyMap[difficulty?.toLowerCase()] || 'difficulty-medium';
    }

    /**
     * Retourne l'icône pour la difficulté
     */
    getDifficultyIcon(difficulty) {
        const iconMap = {
            'simple': 'fas fa-leaf',
            'moyenne': 'fas fa-hiking',
            'difficile': 'fas fa-mountain'
        };
        return iconMap[difficulty?.toLowerCase()] || 'fas fa-hiking';
    }

    /**
     * Met à jour le statut de completion
     */
    updateCompletionStatus(completed) {
        const card = document.querySelector(`[data-day="${this.stage.day}"]`);
        if (!card) return;

        card.classList.toggle('completed', completed);
        
        const checkbox = card.querySelector('.stage-checkbox');
        if (checkbox) checkbox.checked = completed;

        const statusBadge = card.querySelector('.stage-status');
        if (statusBadge) {
            statusBadge.className = `stage-status ${completed ? 'completed' : 'pending'}`;
            statusBadge.innerHTML = `
                <i class="fas ${completed ? 'fa-check-circle' : 'fa-clock'}"></i>
                <span>${completed ? 'Terminée' : ''}</span>
            `;
        }
    }

    /**
     * Ajoute les event listeners pour cette carte
     */
    setupEventListeners() {
        // Event listeners supprimés - validation maintenant dans la modal
    }

    /**
     * Méthode statique pour créer et rendre une carte
     */
    static create(stage, options = {}) {
        const card = new StageCard(stage, options);
        return card.render();
    }

    /**
     * Méthode statique pour créer et attacher une carte au DOM
     */
    static createAndAttach(stage, container, options = {}) {
        const card = new StageCard(stage, options);
        const cardElement = document.createElement('div');
        cardElement.innerHTML = card.render();
        
        container.appendChild(cardElement.firstElementChild);
        card.attachEventListeners();
        
        return card;
    }
}

// Export pour utilisation globale
window.StageCard = StageCard;
