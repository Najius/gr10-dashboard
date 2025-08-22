// Module principal de l'application
class GR10App {
    constructor() {
        this.data = [];
        this.init();
    }

    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadData();
                this.renderStages();
                this.setupEventListeners();
                
                // Initialiser le dashboard de progression
                if (window.progressManager) {
                    window.progressManager.updateProgressDashboard();
                }
            });
        } else {
            // DOM déjà chargé
            this.loadData();
            this.renderStages();
            this.setupEventListeners();
            
            // Initialiser le dashboard de progression
            if (window.progressManager) {
                window.progressManager.updateProgressDashboard();
            }
        }
    }

    async loadData() {
        // Utiliser directement les données intégrées depuis data.js
        if (window.itineraryData) {
            this.data = window.itineraryData;
            console.log('Données chargées depuis data.js:', this.data.length, 'étapes');
        } else {
            console.error('Aucune donnée disponible');
            this.data = [];
        }
    }

    renderStages() {
        const container = document.getElementById('stages-container');
        if (!container) {
            console.error('Container stages-container non trouvé!');
            return;
        }

        container.innerHTML = '';
        
        let currentStageCard = null;
        const currentDay = this.getCurrentDay();
        
        this.data.forEach(day => {
            const card = this.createStageCard(day);
            container.appendChild(card);
            
            // Mémoriser la carte de l'étape actuelle pour le scroll
            if (day.day === currentDay && !currentStageCard) {
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


    createStageCard(day) {
        const card = document.createElement('div');
        card.className = 'stage-card';
        card.dataset.stageDay = day.day;
        
        // Vérifier si l'étape est terminée
        const completedStages = window.progressManager ? 
            window.progressManager.getCompletedStages() : [];
        const isCompleted = completedStages.includes(day.day);
        
        // Déterminer le statut de l'étape (actuelle, à venir, terminée)
        const currentDay = this.getCurrentDay();
        if (isCompleted) {
            card.classList.add('completed');
        } else if (day.day === currentDay) {
            card.classList.add('current');
        } else if (day.day > currentDay) {
            card.classList.add('upcoming');
        }
        
        // Ajouter la classe de difficulté
        const difficultyClass = this.getDifficultyClass(day.difficulty);
        card.classList.add(difficultyClass);
        
        card.innerHTML = `
            <div class="stage-card-header">
                <div class="stage-number">${day.day}</div>
                <div class="stage-title">
                    <h3>${day.from} → ${day.to}</h3>
                    <div class="stage-date">${day.date}</div>
                </div>
            </div>
            <div class="stage-card-body">
                <div class="stage-stats">
                    <div class="stat">
                        <i class="fas fa-route"></i>
                        <span>${day.distance}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-mountain"></i>
                        <span>${day.elevation}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-clock"></i>
                        <span>${day.duration}</span>
                    </div>
                    <div class="stat">
                        <i class="${this.getDifficultyIcon(day.difficulty)}"></i>
                        <span class="difficulty-badge">${day.difficulty}</span>
                    </div>
                </div>
            </div>
        `;
        
        if (isCompleted) {
            card.classList.add('completed');
        }
        
        // Événement de clic pour ouvrir la modale
        card.addEventListener('click', () => {
            if (window.openStageModal) {
                window.openStageModal(day);
            }
        });
        
        return card;
    }

    getDifficultyClass(difficulty) {
        const difficultyMap = {
            'Simple': 'difficulty-simple',
            'Moyenne': 'difficulty-moyenne', 
            'Difficile': 'difficulty-difficile',
            'Repos': 'difficulty-repos',
            'Transport': 'difficulty-transport'
        };
        return difficultyMap[difficulty] || 'difficulty-simple';
    }

    getDifficultyIcon(difficulty) {
        const iconMap = {
            'Simple': 'fas fa-walking',        // Marche - facile
            'Moyenne': 'fas fa-hiking',        // Randonnée - moyen
            'Difficile': 'fas fa-exclamation-triangle', // Triangle d'alerte - difficile
            'Repos': 'fas fa-bed',             // Lit - repos
            'Transport': 'fas fa-bus'          // Bus - transport
        };
        return iconMap[difficulty] || 'fas fa-walking';
    }

    setupEventListeners() {
        // Les événements sont maintenant gérés par les modules spécialisés
        console.log('Application GR10 initialisée');
        
        // Mettre à jour l'affichage des cartes après initialisation
        if (window.progressManager) {
            window.progressManager.updateStageCards();
        }
    }
}

// Initialiser l'application
window.app = new GR10App();
