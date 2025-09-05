/* ========================================
   INTERACTIONS MOBILES GR10 DASHBOARD
   Gestion des gestes tactiles et navigation
   ======================================== */

class MobileInteractions {
    constructor() {
        this.currentStageIndex = 0;
        this.totalStages = 0;
        this.isFullscreen = false;
        this.swipeThreshold = 50;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isSwipeEnabled = true;
        
        this.init();
    }

    init() {
        this.detectMobile();
        this.setupSwipeNavigation();
        this.setupFullscreenMode();
        this.setupTouchFeedback();
        this.setupStageNavigation();
        this.optimizeForMobile();
    }

    detectMobile() {
        const isMobile = window.innerWidth <= 768 || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            document.body.classList.add('mobile-device');
            this.setupMobileSpecificFeatures();
        }
    }

    setupMobileSpecificFeatures() {
        // Prévenir le zoom accidentel
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prévenir le double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Masquer la barre d'adresse sur scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    if (window.scrollY > 50) {
                        document.body.classList.add('scrolled');
                    } else {
                        document.body.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    setupSwipeNavigation() {
        let startX, startY, distX, distY;
        
        document.addEventListener('touchstart', (e) => {
            if (!this.isSwipeEnabled) return;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            this.touchStartX = startX;
            this.touchStartY = startY;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.isSwipeEnabled) return;
            
            const touch = e.touches[0];
            distX = touch.clientX - startX;
            distY = touch.clientY - startY;
            
            // Afficher l'indicateur de swipe si le mouvement est suffisant
            if (Math.abs(distX) > 30 && Math.abs(distX) > Math.abs(distY)) {
                this.showSwipeIndicator(distX > 0 ? 'previous' : 'next');
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!this.isSwipeEnabled) return;
            
            this.hideSwipeIndicator();
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            distX = endX - this.touchStartX;
            distY = endY - this.touchStartY;
            
            // Vérifier si c'est un swipe horizontal
            if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > this.swipeThreshold) {
                if (distX > 0) {
                    this.navigateToPreviousStage();
                } else {
                    this.navigateToNextStage();
                }
            }
        }, { passive: true });
    }

    setupStageNavigation() {
        // Créer les boutons de navigation
        const navContainer = document.createElement('div');
        navContainer.className = 'stage-navigation';
        navContainer.innerHTML = `
            <button class="stage-nav-btn" id="prev-stage" aria-label="Étape précédente">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="stage-counter">1 / ${this.totalStages}</span>
            <button class="stage-nav-btn" id="next-stage" aria-label="Étape suivante">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        document.body.appendChild(navContainer);
        
        // Event listeners pour les boutons
        document.getElementById('prev-stage').addEventListener('click', () => {
            this.navigateToPreviousStage();
        });
        
        document.getElementById('next-stage').addEventListener('click', () => {
            this.navigateToNextStage();
        });
        
        this.updateNavigationButtons();
    }

    navigateToPreviousStage() {
        if (this.currentStageIndex > 0) {
            this.currentStageIndex--;
            this.scrollToStage(this.currentStageIndex);
            this.updateNavigationButtons();
            this.showSwipeIndicator('previous', true);
        }
    }

    navigateToNextStage() {
        if (this.currentStageIndex < this.totalStages - 1) {
            this.currentStageIndex++;
            this.scrollToStage(this.currentStageIndex);
            this.updateNavigationButtons();
            this.showSwipeIndicator('next', true);
        }
    }

    scrollToStage(index) {
        const stages = document.querySelectorAll('.stage-card');
        if (stages[index]) {
            stages[index].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Highlight temporaire
            stages[index].classList.add('highlighted');
            setTimeout(() => {
                stages[index].classList.remove('highlighted');
            }, 1000);
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-stage');
        const nextBtn = document.getElementById('next-stage');
        const counter = document.querySelector('.stage-counter');
        
        if (prevBtn) prevBtn.disabled = this.currentStageIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentStageIndex === this.totalStages - 1;
        if (counter) counter.textContent = `${this.currentStageIndex + 1} / ${this.totalStages}`;
    }

    showSwipeIndicator(direction, isAction = false) {
        let indicator = document.querySelector('.swipe-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'swipe-indicator';
            document.body.appendChild(indicator);
        }
        
        const icon = direction === 'previous' ? '←' : '→';
        const text = direction === 'previous' ? 'Étape précédente' : 'Étape suivante';
        
        indicator.innerHTML = `${icon} ${text}`;
        indicator.classList.add('show');
        
        if (isAction) {
            indicator.style.background = 'rgba(34, 197, 94, 0.9)';
            setTimeout(() => {
                indicator.style.background = 'rgba(0, 0, 0, 0.8)';
            }, 500);
        }
        
        clearTimeout(this.indicatorTimeout);
        this.indicatorTimeout = setTimeout(() => {
            this.hideSwipeIndicator();
        }, isAction ? 1500 : 1000);
    }

    hideSwipeIndicator() {
        const indicator = document.querySelector('.swipe-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    setupFullscreenMode() {
        // Créer le bouton plein écran
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-toggle';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.setAttribute('aria-label', 'Mode plein écran');
        
        document.body.appendChild(fullscreenBtn);
        
        fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Écouter les changements de plein écran
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenButton();
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
                document.body.classList.add('fullscreen-mode');
                this.showToast('Mode plein écran activé', 'success');
            }).catch(err => {
                console.log('Erreur plein écran:', err);
                this.showToast('Plein écran non disponible', 'warning');
            });
        } else {
            document.exitFullscreen().then(() => {
                this.isFullscreen = false;
                document.body.classList.remove('fullscreen-mode');
                this.showToast('Mode plein écran désactivé', 'info');
            });
        }
    }

    updateFullscreenButton() {
        const btn = document.querySelector('.fullscreen-toggle');
        const icon = btn.querySelector('i');
        
        if (document.fullscreenElement) {
            icon.className = 'fas fa-compress';
            btn.setAttribute('aria-label', 'Quitter le plein écran');
        } else {
            icon.className = 'fas fa-expand';
            btn.setAttribute('aria-label', 'Mode plein écran');
        }
    }

    setupTouchFeedback() {
        // Ajouter un feedback tactile à tous les éléments interactifs
        const interactiveElements = document.querySelectorAll(
            'button, .btn, .nav-link, .stage-card, .weather-widget, a[href]'
        );
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            }, { passive: true });
            
            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
            
            element.addEventListener('touchcancel', () => {
                element.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    optimizeForMobile() {
        // Optimiser les images pour mobile
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.loading = 'lazy';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        });
        
        // Optimiser les vidéos
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.setAttribute('playsinline', '');
            video.setAttribute('preload', 'metadata');
        });
        
        // Désactiver les animations coûteuses sur mobile
        if (window.innerWidth <= 768) {
            document.body.classList.add('reduced-motion');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `mobile-toast mobile-toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animation d'entrée
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Suppression automatique
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    updateStageCount(count) {
        this.totalStages = count;
        this.updateNavigationButtons();
    }

    setCurrentStage(index) {
        this.currentStageIndex = Math.max(0, Math.min(index, this.totalStages - 1));
        this.updateNavigationButtons();
    }

    enableSwipe() {
        this.isSwipeEnabled = true;
    }

    disableSwipe() {
        this.isSwipeEnabled = false;
    }
}

// CSS pour les toasts mobiles
const toastStyles = `
.mobile-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    transition: transform 0.3s ease;
    backdrop-filter: blur(10px);
}

.mobile-toast.show {
    transform: translateX(-50%) translateY(0);
}

.mobile-toast-success {
    background: rgba(16, 185, 129, 0.9);
}

.mobile-toast-warning {
    background: rgba(245, 158, 11, 0.9);
}

.mobile-toast-info {
    background: rgba(59, 130, 246, 0.9);
}

.touch-active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
}

.stage-card.highlighted {
    border: 3px solid var(--primary-color);
    box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
    transition: all 0.3s ease;
}

@media (max-width: 768px) {
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
`;

// Injecter les styles
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// Initialiser les interactions mobiles
let mobileInteractions;
document.addEventListener('DOMContentLoaded', () => {
    mobileInteractions = new MobileInteractions();
});

// Exporter pour utilisation globale
window.MobileInteractions = MobileInteractions;
