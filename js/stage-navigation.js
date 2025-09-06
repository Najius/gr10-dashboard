/**
 * Navigation horizontale pour les grandes cartes verticales
 * Gère le scroll horizontal et les indicateurs de position
 */

class StageNavigation {
    constructor() {
        this.currentIndex = 0;
        this.stages = [];
        this.container = null;
        this.indicators = [];
        this.isScrolling = false;
        this.startX = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.threshold = 100;
        
        this.init();
    }

    init() {
        this.container = document.getElementById('stages-container');
        if (!this.container) return;
        
        this.setupEventListeners();
        this.createIndicators();
        this.createControls();
        this.createProgressIndicator();
        this.updateStages();
    }

    setupEventListeners() {
        // Navigation clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goToPrevious();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.goToNext();
            }
        });
        
        // Support tactile avancé
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Support souris pour desktop
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    createIndicators() {
        // Supprimer les anciens indicateurs
        const existingNav = document.querySelector('.stage-navigation');
        if (existingNav) {
            existingNav.remove();
        }
        
        const nav = document.createElement('div');
        nav.className = 'stage-navigation';
        
        this.stages.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            if (index === this.currentIndex) {
                dot.classList.add('active');
            }
            
            dot.addEventListener('click', () => {
                this.goToStage(index);
            });
            
            nav.appendChild(dot);
            this.indicators.push(dot);
        });
        
        document.body.appendChild(nav);
    }
    
    createControls() {
        // Contrôles de swipe
        const leftControl = document.createElement('div');
        leftControl.className = 'swipe-controls swipe-control left';
        leftControl.innerHTML = '<i class="fas fa-chevron-left"></i>';
        leftControl.addEventListener('click', () => this.goToPrevious());
        
        const rightControl = document.createElement('div');
        rightControl.className = 'swipe-controls swipe-control right';
        rightControl.innerHTML = '<i class="fas fa-chevron-right"></i>';
        rightControl.addEventListener('click', () => this.goToNext());
        
        document.body.appendChild(leftControl);
        document.body.appendChild(rightControl);
    }
    
    createProgressIndicator() {
        const progress = document.createElement('div');
        progress.className = 'progress-indicator';
        progress.id = 'stage-progress';
        document.body.appendChild(progress);
        this.updateProgress();
    }

    updateStages() {
        this.stages = Array.from(this.container.children);
        
        // Appliquer les classes d'état
        this.stages.forEach((stage, index) => {
            stage.classList.remove('active', 'prev', 'next');
            
            if (index === this.currentIndex) {
                stage.classList.add('active');
            } else if (index < this.currentIndex) {
                stage.classList.add('prev');
            } else {
                stage.classList.add('next');
            }
        });
        
        // Mettre à jour les indicateurs
        this.updateIndicators();
        this.updateProgress();
    }

    updateIndicators() {
        this.indicators.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    updateProgress() {
        const progress = document.getElementById('stage-progress');
        if (progress && this.stages.length > 0) {
            progress.textContent = `Étape ${this.currentIndex + 1} sur ${this.stages.length}`;
        }
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.currentX = this.startX;
        this.isDragging = true;
        
        // Ajouter classe pour désactiver les transitions
        this.stages.forEach(stage => stage.classList.add('swiping'));
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        
        this.currentX = e.touches[0].clientX;
        const diff = this.currentX - this.startX;
        
        // Appliquer l'effet de swipe visuel
        const currentStage = this.stages[this.currentIndex];
        if (currentStage) {
            const progress = Math.min(Math.abs(diff) / this.threshold, 1);
            
            if (diff > 0) {
                // Swipe vers la droite (étape précédente)
                currentStage.style.transform = `translateX(${diff}px) scale(${1 - progress * 0.05})`;
                currentStage.style.opacity = 1 - progress * 0.3;
            } else {
                // Swipe vers la gauche (étape suivante)
                currentStage.style.transform = `translateX(${diff}px) scale(${1 - progress * 0.05})`;
                currentStage.style.opacity = 1 - progress * 0.3;
            }
        }
        
        e.preventDefault();
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        const diff = this.startX - this.currentX;
        
        // Réinitialiser les styles
        this.stages.forEach(stage => {
            stage.classList.remove('swiping');
            stage.style.transform = '';
            stage.style.opacity = '';
        });
        
        // Déterminer la direction
        if (Math.abs(diff) > this.threshold) {
            if (diff > 0) {
                this.goToNext();
            } else {
                this.goToPrevious();
            }
        }
        
        this.isDragging = false;
    }

    handleMouseDown(e) {
        this.startX = e.clientX;
        this.currentX = this.startX;
        this.isDragging = true;
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        this.currentX = e.clientX;
        e.preventDefault();
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        const diff = this.startX - this.currentX;
        
        if (Math.abs(diff) > this.threshold) {
            if (diff > 0) {
                this.goToNext();
            } else {
                this.goToPrevious();
            }
        }
        
        this.isDragging = false;
    }

    goToPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateStages();
        }
    }

    goToNext() {
        if (this.currentIndex < this.stages.length - 1) {
            this.currentIndex++;
            this.updateStages();
        }
    }

    goToStage(index) {
        if (index < 0 || index >= this.stages.length || index === this.currentIndex) {
            return;
        }
        
        this.currentIndex = index;
        this.updateStages();
    }

    // Méthode pour centrer sur l'étape courante
    scrollToCurrentStage() {
        // Trouver l'étape courante (celle avec la classe 'current')
        const currentCard = this.container.querySelector('.stage-card.current');
        if (currentCard) {
            const cards = Array.from(this.container.querySelectorAll('.stage-card'));
            const currentStageIndex = cards.indexOf(currentCard);
            if (currentStageIndex !== -1) {
                this.scrollToIndex(currentStageIndex);
            }
        }
    }

    // Méthode appelée après le rendu des étapes
    onStagesRendered(stageCount) {
        this.updateStageCount(stageCount);
        
        // Centrer sur l'étape courante après un court délai
        setTimeout(() => {
            this.scrollToCurrentStage();
        }, 300);
    }

    // Méthode pour obtenir l'étape visible
    getCurrentVisibleStage() {
        return this.currentIndex;
    }

    // Méthode pour aller à une étape spécifique par numéro d'étape
    goToStage(stageNumber) {
        // Trouver l'index de l'étape par son numéro
        const cards = this.container.querySelectorAll('.stage-card');
        let targetIndex = -1;
        
        cards.forEach((card, index) => {
            const stageId = parseInt(card.getAttribute('data-stage-id'));
            if (stageId === stageNumber) {
                targetIndex = index;
            }
        });
        
        if (targetIndex !== -1) {
            this.scrollToIndex(targetIndex);
        }
    }
}

// Initialiser la navigation globalement
window.stageNavigation = new StageNavigation();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StageNavigation;
}
