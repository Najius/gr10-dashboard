// Application principale pour la version publique
class PublicApp {
    constructor() {
        this.init();
    }

    init() {
        this.loadItinerary();
        this.updateStatus();
        this.setupStageCards();
    }

    loadItinerary() {
        if (!window.itineraryData) {
            console.error('Données d\'itinéraire non disponibles');
            return;
        }

        this.renderStageCards();
        this.updateProgressFromAdmin();
    }

    updateStatus() {
        const statusBadge = document.getElementById('current-status');
        if (!statusBadge) return;

        const now = new Date();
        const startDate = new Date('2025-09-08');
        const endDate = new Date('2025-10-25');

        if (now < startDate) {
            statusBadge.textContent = 'En préparation';
            statusBadge.className = 'status-badge status-preparation';
        } else if (now >= startDate && now <= endDate) {
            statusBadge.textContent = 'En cours';
            statusBadge.className = 'status-badge status-active';
        } else {
            statusBadge.textContent = 'Terminé';
            statusBadge.className = 'status-badge status-completed';
        }
    }

    renderStageCards() {
        const container = document.getElementById('stages-container');
        if (!container || !window.itineraryData) return;

        container.innerHTML = '';
        let currentStageCard = null;
        const currentDay = this.getCurrentDay();
        
        window.itineraryData.forEach(stage => {
            const cardHTML = this.createPublicStageCard(stage);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            const card = tempDiv.firstElementChild;
            container.appendChild(card);
            
            // Mémoriser la carte de l'étape actuelle pour le scroll
            if (stage.day === currentDay && !currentStageCard) {
                currentStageCard = card;
            }
        });
        
        // Scroller vers l'étape actuelle après un court délai
        if (currentStageCard) {
            setTimeout(() => {
                currentStageCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        }
    }

    createPublicStageCard(stage) {
        const completedStages = window.progressManager?.getCompletedStages() || [];
        const isCompleted = completedStages.includes(stage.day);
        const difficultyClass = this.getDifficultyClass(stage.difficulty);
        
        // Déterminer le statut de l'étape (actuelle, à venir, terminée)
        const currentDay = this.getCurrentDay();
        let statusClass = '';
        if (isCompleted) {
            statusClass = 'completed';
        } else if (stage.day === currentDay) {
            statusClass = 'current';
        } else if (stage.day > currentDay) {
            statusClass = 'upcoming';
        }

        return `
            <div class="stage-card ${statusClass} ${difficultyClass}" data-stage-day="${stage.day}">
                ${isCompleted ? `
                <div class="stage-actions">
                    <div class="stage-status completed">
                        <i class="fas fa-check-circle"></i>
                        <span>Terminée</span>
                    </div>
                </div>` : ''}
                <div class="stage-card-header">
                    <div class="stage-number">${stage.day}</div>
                    <div class="stage-title">
                        <h3>${stage.from} → ${stage.to}</h3>
                        <div class="stage-date">${stage.date}</div>
                    </div>
                </div>
                <div class="stage-card-body">
                    <div class="stage-info-row">
                        <div class="stage-stats">
                            <div class="stat">
                                <i class="fas fa-route"></i>
                                <span>${stage.distance}</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-mountain"></i>
                                <span>${stage.elevation}</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-clock"></i>
                                <span>${stage.duration}</span>
                            </div>
                            <div class="stat">
                                <i class="${this.getDifficultyIcon(stage.difficulty)}"></i>
                                <span class="difficulty-badge">${stage.difficulty}</span>
                            </div>
                        </div>
                        <button class="btn btn-outline view-details-btn" onclick="openPublicStageModal(${stage.day})">
                            <i class="fas fa-eye"></i>
                            Voir les détails
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getCurrentDay() {
        // Calculer l'étape actuelle basée sur la date du jour
        const today = new Date();
        const startDate = new Date('2025-09-08'); // Date de début du GR10
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        
        // Si on n'a pas encore commencé, retourner l'étape 1
        if (daysDiff < 0) return 1;
        
        // Si on a dépassé les 48 jours, retourner la dernière étape
        if (daysDiff >= 48) return 48;
        
        // Sinon retourner l'étape correspondante (jour 0 = étape 1)
        return daysDiff + 1;
    }


    getDifficultyClass(difficulty) {
        switch(difficulty?.toLowerCase()) {
            case 'simple': return 'difficulty-easy';
            case 'moyenne': return 'difficulty-medium';
            case 'difficile': return 'difficulty-hard';
            default: return 'difficulty-medium';
        }
    }

    getDifficultyIcon(difficulty) {
        switch(difficulty?.toLowerCase()) {
            case 'simple': return 'fas fa-signal';
            case 'moyenne': return 'fas fa-signal';
            case 'difficile': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-signal';
        }
    }

    updateProgressFromAdmin() {
        // Utiliser le même système de progression que l'admin
        if (window.progressManager) {
            window.progressManager.updateProgressDashboard();
            this.updateStageCardsStatus();
        }
    }

    updateStageCardsStatus() {
        const completedStages = window.progressManager?.getCompletedStages() || [];
        const cards = document.querySelectorAll('.stage-card');
        
        cards.forEach(card => {
            const stageDay = parseInt(card.dataset.stageDay);
            const isCompleted = completedStages.includes(stageDay);
            
            card.classList.toggle('completed', isCompleted);
            
            const statusDiv = card.querySelector('.stage-status');
            const statusIcon = card.querySelector('.stage-status i');
            const statusText = card.querySelector('.stage-status span');
            
            if (statusDiv && statusIcon && statusText) {
                statusDiv.classList.toggle('completed', isCompleted);
                statusDiv.classList.toggle('pending', !isCompleted);
                
                if (isCompleted) {
                    statusIcon.className = 'fas fa-check-circle';
                    statusText.textContent = 'Terminée';
                    statusDiv.style.display = 'flex';
                } else {
                    statusDiv.style.display = 'none';
                }
            }
        });
    }

    setupStageCards() {
        // Actualiser périodiquement le statut
        let currentStageCard = null;
        const currentDay = this.getCurrentDay();
        const container = document.getElementById('stages-container');
        
        window.itineraryData.forEach(stage => {
            const card = this.createPublicStageCard(stage);
            container.appendChild(card);
            
            // Mémoriser la carte de l'étape actuelle pour le scroll
            if (stage.day === currentDay && !currentStageCard) {
                currentStageCard = card;
            }
        });
        
        // Scroller vers l'étape actuelle après un court délai
        if (currentStageCard) {
            setTimeout(() => {
                currentStageCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        }

        console.log('Toutes les cartes d\'étapes ont été ajoutées');
    }
}

// Fonction globale pour ouvrir la modal
window.openPublicStageModal = function(stageDay) {
    const stage = window.itineraryData?.find(s => s.day === stageDay);
    if (stage && window.publicModalManager) {
        window.publicModalManager.openModal(stage);
    }
};

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.publicApp = new PublicApp();
});
