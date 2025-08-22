// Module de gestion de la progression
class ProgressManager {
    constructor() {
        this.storageKey = 'gr10-completed-stages';
    }

    // Récupérer les étapes terminées
    getCompletedStages() {
        const completed = localStorage.getItem(this.storageKey);
        return completed ? JSON.parse(completed) : [];
    }

    // Sauvegarder les étapes terminées
    saveCompletedStages(completedStages) {
        localStorage.setItem(this.storageKey, JSON.stringify(completedStages));
    }

    // Vérifier si une étape peut être validée (ordre séquentiel)
    canValidateStage(stageDay) {
        const completedStages = this.getCompletedStages();
        
        // L'étape 1 peut toujours être validée
        if (stageDay === 1) return true;
        
        // Pour les autres étapes, vérifier que la précédente est terminée
        return completedStages.includes(stageDay - 1);
    }

    // Basculer l'état d'une étape (avec contrainte séquentielle)
    toggleStageCompletion(stageDay) {
        const completedStages = this.getCompletedStages();
        const index = completedStages.indexOf(stageDay);
        
        // Si l'étape est déjà terminée, on peut la dévalider
        if (index > -1) {
            // Dévalider aussi toutes les étapes suivantes
            const stagesToRemove = completedStages.filter(stage => stage >= stageDay);
            stagesToRemove.forEach(stage => {
                const idx = completedStages.indexOf(stage);
                if (idx > -1) completedStages.splice(idx, 1);
            });
        } else {
            // Vérifier si on peut valider cette étape
            if (!this.canValidateStage(stageDay)) {
                alert(`Vous devez d'abord terminer l'étape ${stageDay - 1} avant de valider l'étape ${stageDay}.`);
                return;
            }
            completedStages.push(stageDay);
        }
        
        this.saveCompletedStages(completedStages);
        this.updateProgressDashboard();
        this.updateStageCards();
    }

    // Mettre à jour le dashboard de progression
    updateProgressDashboard() {
        const completedStages = this.getCompletedStages();
        const totalStages = window.itineraryData ? window.itineraryData.length : 48;
        const completedCount = completedStages.length;
        const remainingCount = totalStages - completedCount;
        const percentage = Math.round((completedCount / totalStages) * 100);
        
        // Calculer la distance totale parcourue et les dénivelés
        let totalDistance = 0;
        let totalElevationPositive = 0;
        let totalElevationNegative = 0;
        if (window.itineraryData) {
            completedStages.forEach(stageDay => {
                const stage = window.itineraryData.find(s => s.day === stageDay);
                if (stage) {
                    // Distance
                    if (stage.distance) {
                        const distance = parseInt(stage.distance.replace(/[^\d]/g, ''));
                        if (!isNaN(distance)) totalDistance += distance;
                    }
                    // Dénivelés positif et négatif
                    if (stage.elevation) {
                        const positiveMatch = stage.elevation.match(/\+(\d+)m/);
                        const negativeMatch = stage.elevation.match(/-(\d+)m/);
                        
                        if (positiveMatch) {
                            const elevation = parseInt(positiveMatch[1]);
                            if (!isNaN(elevation)) totalElevationPositive += elevation;
                        }
                        
                        if (negativeMatch) {
                            const elevation = parseInt(negativeMatch[1]);
                            if (!isNaN(elevation)) totalElevationNegative += elevation;
                        }
                    }
                }
            });
        }
        
        // Mettre à jour les éléments du dashboard
        const elements = {
            'completed-stages': completedCount,
            'remaining-stages': remainingCount,
            'total-distance': totalDistance,
            'total-elevation-positive': totalElevationPositive,
            'total-elevation-negative': totalElevationNegative,
            'completion-percentage': percentage + '%'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = percentage + '%';
    }

    // Mettre à jour l'affichage des cartes d'étapes
    updateStageCards() {
        const completedStages = this.getCompletedStages();
        const cards = document.querySelectorAll('.stage-card');
        
        // Trouver la prochaine étape à valider
        const nextStageToValidate = this.getNextStageToValidate();
        
        cards.forEach(card => {
            const stageDay = parseInt(card.dataset.stageDay);
            const isCompleted = completedStages.includes(stageDay);
            const isNextToValidate = stageDay === nextStageToValidate;
            
            // Gestion des classes CSS
            card.classList.toggle('completed', isCompleted);
            card.classList.toggle('locked', !isCompleted && !isNextToValidate);
            
            const validateBtn = card.querySelector('.validate-btn');
            if (validateBtn) {
                if (isCompleted) {
                    validateBtn.textContent = '✓ Terminée';
                    validateBtn.classList.add('completed');
                    validateBtn.classList.remove('locked');
                    validateBtn.disabled = false;
                    validateBtn.style.display = 'block';
                } else if (isNextToValidate) {
                    validateBtn.textContent = 'Valider';
                    validateBtn.classList.remove('completed', 'locked');
                    validateBtn.disabled = false;
                    validateBtn.style.display = 'block';
                } else {
                    validateBtn.style.display = 'none';
                }
            }
        });
    }

    // Trouver la prochaine étape à valider
    getNextStageToValidate() {
        const completedStages = this.getCompletedStages();
        
        // Si aucune étape n'est terminée, c'est l'étape 1
        if (completedStages.length === 0) return 1;
        
        // Sinon, c'est la plus petite étape non terminée
        const maxCompleted = Math.max(...completedStages);
        return maxCompleted + 1;
    }
}

// Instance globale
window.progressManager = new ProgressManager();

// Fonction globale pour l'onclick
window.toggleStageCompletion = function(stageDay) {
    window.progressManager.toggleStageCompletion(stageDay);
};
