// Module de gestion des modales
class ModalManager {
    constructor() {
        this.modal = null;
        this.closeBtn = null;
        this.tabBtns = [];
        this.tabPanes = [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.modal = document.getElementById('stage-modal');
            this.closeBtn = document.querySelector('.close');
            this.tabBtns = document.querySelectorAll('.tab-btn');
            this.tabPanes = document.querySelectorAll('.tab-pane');
            
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Fermer la modale
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Fermer en cliquant à l'extérieur
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });

        // Gestion des onglets
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                this.switchTab(targetTab);
            });
        });

        // Gestion du checkbox de completion dans la modal
        document.addEventListener('change', (event) => {
            if (event.target.id === 'modal-stage-checkbox') {
                const completed = event.target.checked;
                const currentStage = this.getCurrentStageFromModal();
                this.handleStageCompletion(currentStage, completed);
            }
        });

        // Évaluation par étoiles
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('star')) {
                const rating = parseInt(event.target.dataset.rating);
                const currentStage = this.getCurrentStageFromModal();
                this.updateStarRating(rating);
                localStorage.setItem(`stage_rating_${currentStage}`, rating);
            }
        });

        // Gestion des notes avec états
        this.setupNotesHandlers();

        // Upload de photos
        const photoInput = document.getElementById('photo-input');
        if (photoInput) {
            photoInput.addEventListener('change', (event) => {
                this.handlePhotoUpload(event);
            });
        }
    }

    openModal(day) {
        const modal = document.getElementById('stage-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalDetails = document.getElementById('modal-details');
        
        if (!modal || !modalTitle || !modalDetails) {
            console.error('Éléments de modal manquants');
            return;
        }

        modalTitle.textContent = `Jour ${day.day}: ${day.from} → ${day.to}`;
        modalDetails.innerHTML = this.generateModalContent(day);
        
        // Mettre à jour le checkbox de completion
        this.updateModalCheckbox(day.day);
        
        // Ajouter directement la classe show sans display block
        modal.classList.add('show');
        
        this.loadSavedData(day.day);
        this.setupModalEventListeners();
    }

    closeModal() {
        const modal = document.getElementById('stage-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    switchTab(targetTab) {
        // Mettre à jour les boutons d'onglets
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-tab="${targetTab}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Mettre à jour les panneaux d'onglets
        this.tabPanes.forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === `${targetTab}-tab`) {
                pane.classList.add('active');
            }
        });
    }

    generateModalContent(day) {
        const difficultyIcon = this.getDifficultyIcon(day.difficulty);
        
        return `
            <div class="grid grid-3">
                <div class="info-item">
                    <i class="fas fa-route info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Distance</strong>
                        <span class="info-item-value">${day.distance}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-mountain info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Dénivelé</strong>
                        <span class="info-item-value">${day.elevation}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Durée</strong>
                        <span class="info-item-value">${day.duration}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="${difficultyIcon} info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Difficulté</strong>
                        <span class="difficulty-badge ${this.getDifficultyClass(day.difficulty)}">${day.difficulty}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-tree info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Terrain</strong>
                        <span class="info-item-value">${day.terrain}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-bed info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Hébergement</strong>
                        <span class="info-item-value">${day.refuge}</span>
                        ${day.refugePhone ? `<br><small style="color: var(--text-muted);"><i class="fas fa-phone" style="margin-right: 4px;"></i>${day.refugePhone}</small>` : ''}
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-tint info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Eau</strong>
                        <span class="info-item-value">${day.water}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-shopping-cart info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Ravitaillement</strong>
                        <span class="info-item-value">${day.supplies}</span>
                    </div>
                </div>
                ${day.network ? `
                <div class="info-item">
                    <i class="fas fa-signal info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Réseau</strong>
                        <span class="info-item-value">${day.network}</span>
                    </div>
                </div>
                ` : ''}
                ${day.bivouacA ? `
                <div class="info-item">
                    <i class="fas fa-campground info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Bivouac A</strong>
                        <span class="info-item-value">${day.bivouacA}</span>
                    </div>
                </div>
                ` : ''}
                ${day.bivouacB ? `
                <div class="info-item">
                    <i class="fas fa-campground info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Bivouac B</strong>
                        <span class="info-item-value">${day.bivouacB}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    getDifficultyIcon(difficulty) {
        const iconMap = {
            'Simple': 'fas fa-walking',
            'Moyenne': 'fas fa-hiking', 
            'Difficile': 'fas fa-exclamation-triangle',
            'Repos': 'fas fa-bed',
            'Transport': 'fas fa-bus'
        };
        return iconMap[difficulty] || 'fas fa-walking';
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

    getCurrentStageFromModal() {
        const title = document.getElementById('modal-title')?.textContent || '';
        const dayMatch = title.match(/Jour (\d+)/);
        return dayMatch ? parseInt(dayMatch[1]) : 1;
    }

    updateStarRating(rating) {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    setupNotesHandlers() {
        // Utiliser une approche par délégation d'événements pour éviter les doublons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#notes-placeholder')) {
                this.showNotesEditor();
            } else if (e.target.closest('#save-notes') || e.target.closest('#save-notes-display')) {
                this.saveNotes();
            } else if (e.target.closest('#cancel-notes') || e.target.closest('#cancel-notes-display')) {
                this.cancelNotesEdit();
            } else if (e.target.closest('#edit-notes')) {
                this.showNotesEditorInline();
            }
        });

        // Raccourci clavier pour sauvegarder (Ctrl/Cmd + Enter)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const textarea = document.getElementById('stage-notes');
                if (textarea && textarea === document.activeElement) {
                    e.preventDefault();
                    this.saveNotes();
                }
            }
        });
    }

    showNotesEditorInline() {
        const notesContent = document.getElementById('notes-content');
        const editBtn = document.getElementById('edit-notes');
        const saveBtn = document.getElementById('save-notes-display');
        const cancelBtn = document.getElementById('cancel-notes-display');
        
        if (!notesContent) return;
        
        // Stocker la valeur originale
        this.originalNotesValue = notesContent.textContent;
        
        // Remplacer le contenu par un textarea
        notesContent.innerHTML = `<textarea id="inline-notes-editor" style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: inherit; resize: vertical;">${this.originalNotesValue}</textarea>`;
        
        // Afficher les boutons
        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        
        // Focus sur le textarea
        const textarea = document.getElementById('inline-notes-editor');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }

    showNotesEditor() {
        const placeholder = document.getElementById('notes-placeholder');
        const editor = document.getElementById('notes-editor');
        const display = document.getElementById('notes-display');
        const textarea = document.getElementById('stage-notes');

        if (!placeholder || !editor || !display || !textarea) return;

        placeholder.style.display = 'none';
        display.style.display = 'none';
        editor.style.display = 'block';
        
        // Stocker la valeur originale pour l'annulation
        this.originalNotesValue = textarea.value;
        
        // Attendre que l'éditeur soit affiché puis forcer les boutons
        setTimeout(() => {
            const saveBtn = document.getElementById('save-notes');
            const cancelBtn = document.getElementById('cancel-notes');
            const actionsDiv = document.querySelector('.notes-actions');
            
            if (actionsDiv) {
                actionsDiv.style.display = 'flex';
                actionsDiv.style.visibility = 'visible';
            }
            
            if (saveBtn) {
                saveBtn.style.display = 'inline-flex';
                saveBtn.style.visibility = 'visible';
                saveBtn.style.opacity = '1';
                console.log('Save button forced visible');
            }
            if (cancelBtn) {
                cancelBtn.style.display = 'inline-flex';
                cancelBtn.style.visibility = 'visible';
                cancelBtn.style.opacity = '1';
                console.log('Cancel button forced visible');
            }
        }, 50);
        
        // Focus sur le textarea
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });
    }

    showNotesDisplay(content) {
        const placeholder = document.getElementById('notes-placeholder');
        const editor = document.getElementById('notes-editor');
        const display = document.getElementById('notes-display');
        const notesContent = document.getElementById('notes-content');
        const editBtn = document.getElementById('edit-notes');
        const saveBtn = document.getElementById('save-notes-display');
        const cancelBtn = document.getElementById('cancel-notes-display');

        if (!placeholder || !editor || !display || !notesContent) return;

        placeholder.style.display = 'none';
        editor.style.display = 'none';
        display.style.display = 'block';
        notesContent.textContent = content;
        
        // Réinitialiser les boutons
        if (editBtn) editBtn.style.display = 'inline-flex';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
    }

    showNotesPlaceholder() {
        const placeholder = document.getElementById('notes-placeholder');
        const editor = document.getElementById('notes-editor');
        const display = document.getElementById('notes-display');

        if (!placeholder || !editor || !display) return;

        placeholder.style.display = 'block';
        editor.style.display = 'none';
        display.style.display = 'none';
    }

    cancelNotesEdit() {
        const textarea = document.getElementById('stage-notes');
        
        if (textarea) {
            // Restaurer la valeur originale stockée
            textarea.value = this.originalNotesValue || '';
        }

        if (this.originalNotesValue && this.originalNotesValue.trim()) {
            this.showNotesDisplay(this.originalNotesValue);
        } else {
            this.showNotesPlaceholder();
        }
    }

    saveNotes() {
        // Vérifier s'il y a un éditeur inline
        const inlineTextarea = document.getElementById('inline-notes-editor');
        const regularTextarea = document.getElementById('stage-notes');
        
        let notes = '';
        if (inlineTextarea) {
            notes = inlineTextarea.value.trim();
        } else if (regularTextarea) {
            notes = regularTextarea.value.trim();
        }
        
        const currentStage = this.getCurrentStageFromModal();
        
        // Sauvegarder même si vide pour permettre la suppression
        localStorage.setItem(`stage_notes_${currentStage}`, notes);
        
        // Mettre à jour la valeur originale
        this.originalNotesValue = notes;
        
        if (notes) {
            this.showNotesDisplay(notes);
        } else {
            this.showNotesPlaceholder();
        }
        
        // Feedback visuel amélioré
        this.showSaveConfirmation();
    }

    showSaveConfirmation() {
        const btn = document.getElementById('save-notes');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Sauvegardé !';
        btn.style.background = '#10b981';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 1200);
    }

    handlePhotoUpload(event) {
        const files = event.target.files;
        const currentStage = this.getCurrentStageFromModal();
        const existingPhotos = JSON.parse(localStorage.getItem(`stage_photos_${currentStage}`)) || [];
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                existingPhotos.push(e.target.result);
                localStorage.setItem(`stage_photos_${currentStage}`, JSON.stringify(existingPhotos));
                this.displayPhotos(existingPhotos);
            };
            reader.readAsDataURL(file);
        });
        
        event.target.value = '';
    }

    displayPhotos(photos) {
        const gallery = document.getElementById('photo-gallery');
        if (!gallery) return;
        
        gallery.innerHTML = photos.map((photo, index) => 
            `<div class="photo-container">
                <img src="${photo}" alt="Photo d'étape" class="gallery-item" data-photo-index="${index}">
                <button class="delete-photo-btn" data-photo-index="${index}" title="Supprimer cette photo">
                    <i class="fas fa-times"></i>
                </button>
            </div>`
        ).join('');
        
        // Stocker les photos pour la lightbox
        this.currentPhotos = photos;
        
        // Attendre que les images soient dans le DOM puis ajouter les listeners
        setTimeout(() => {
            const galleryItems = gallery.querySelectorAll('.gallery-item');
            const deleteButtons = gallery.querySelectorAll('.delete-photo-btn');
            
            console.log('Found gallery items:', galleryItems.length);
            
            galleryItems.forEach((item, index) => {
                item.addEventListener('click', (e) => {
                    console.log('Photo clicked:', index);
                    e.preventDefault();
                    e.stopPropagation();
                    this.openLightbox(index);
                });
                
                // Ajouter un style pour indiquer que c'est cliquable
                item.style.cursor = 'pointer';
            });
            
            deleteButtons.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.deletePhoto(index);
                });
            });
        }, 100);
    }

    deletePhoto(photoIndex) {
        if (!this.currentPhotos || photoIndex < 0 || photoIndex >= this.currentPhotos.length) return;
        
        // Confirmation avant suppression
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
            return;
        }
        
        // Supprimer la photo du tableau
        this.currentPhotos.splice(photoIndex, 1);
        
        // Sauvegarder dans localStorage
        const currentStage = this.getCurrentStageFromModal();
        localStorage.setItem(`stage_photos_${currentStage}`, JSON.stringify(this.currentPhotos));
        
        // Rafraîchir l'affichage
        this.displayPhotos(this.currentPhotos);
        
        // Feedback visuel
        this.showDeleteConfirmation();
    }

    showDeleteConfirmation() {
        // Créer un toast de confirmation temporaire
        const toast = document.createElement('div');
        toast.className = 'delete-toast';
        toast.innerHTML = '<i class="fas fa-check"></i> Photo supprimée';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    openLightbox(photoIndex) {
        console.log('Opening lightbox for photo index:', photoIndex);
        console.log('Current photos:', this.currentPhotos);
        
        if (!this.currentPhotos || this.currentPhotos.length === 0) {
            console.log('No photos available');
            return;
        }
        
        const lightbox = document.getElementById('photo-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const currentSpan = document.getElementById('lightbox-current');
        const totalSpan = document.getElementById('lightbox-total');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        
        if (!lightbox) {
            console.error('Lightbox element not found');
            return;
        }
        
        this.currentPhotoIndex = photoIndex;
        
        // Mettre à jour l'image et les infos
        if (lightboxImage) lightboxImage.src = this.currentPhotos[photoIndex];
        if (currentSpan) currentSpan.textContent = photoIndex + 1;
        if (totalSpan) totalSpan.textContent = this.currentPhotos.length;
        
        // Gérer les boutons de navigation
        if (prevBtn) prevBtn.disabled = photoIndex === 0;
        if (nextBtn) nextBtn.disabled = photoIndex === this.currentPhotos.length - 1;
        
        // Afficher la lightbox
        console.log('Showing lightbox');
        lightbox.classList.add('show');
        lightbox.style.display = 'flex';
        
        // Ajouter les event listeners s'ils n'existent pas déjà
        if (!this.lightboxInitialized) {
            this.initializeLightbox();
        }
    }

    initializeLightbox() {
        const lightbox = document.getElementById('photo-lightbox');
        const closeBtn = document.querySelector('.lightbox-close');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        
        // Fermer la lightbox
        closeBtn.addEventListener('click', () => {
            lightbox.classList.remove('show');
        });
        
        // Fermer en cliquant sur l'overlay
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('show');
            }
        });
        
        // Navigation précédent
        prevBtn.addEventListener('click', () => {
            if (this.currentPhotoIndex > 0) {
                this.openLightbox(this.currentPhotoIndex - 1);
            }
        });
        
        // Navigation suivant
        nextBtn.addEventListener('click', () => {
            if (this.currentPhotoIndex < this.currentPhotos.length - 1) {
                this.openLightbox(this.currentPhotoIndex + 1);
            }
        });
        
        // Navigation au clavier
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('show')) return;
            
            switch(e.key) {
                case 'Escape':
                    lightbox.classList.remove('show');
                    break;
                case 'ArrowLeft':
                    if (this.currentPhotoIndex > 0) {
                        this.openLightbox(this.currentPhotoIndex - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (this.currentPhotoIndex < this.currentPhotos.length - 1) {
                        this.openLightbox(this.currentPhotoIndex + 1);
                    }
                    break;
            }
        });
        
        this.lightboxInitialized = true;
    }

    loadSavedData(stageDay) {
        // Attendre que le DOM soit prêt avant de charger les données
        setTimeout(() => {
            // Charger la note et afficher le bon état
            const savedNotes = localStorage.getItem(`stage_notes_${stageDay}`);
            const notesTextarea = document.getElementById('stage-notes');
            
            if (notesTextarea) {
                notesTextarea.value = savedNotes || '';
            }
            
            // Afficher le bon état selon qu'il y ait des notes ou non
            if (savedNotes && savedNotes.trim()) {
                this.showNotesDisplay(savedNotes);
            } else {
                this.showNotesPlaceholder();
            }
        }, 100);

        setTimeout(() => {
            // Charger l'évaluation
            const savedRating = localStorage.getItem(`stage_rating_${stageDay}`);
            if (savedRating) {
                this.updateStarRating(parseInt(savedRating));
            }

            // Charger les photos
            const savedPhotos = JSON.parse(localStorage.getItem(`stage_photos_${stageDay}`)) || [];
            this.displayPhotos(savedPhotos);
        }, 100);
    }

    updateModalCheckbox(stageDay) {
        const checkbox = document.getElementById('modal-stage-checkbox');
        if (checkbox) {
            // Utiliser progressManager si disponible, sinon localStorage direct
            let isCompleted = false;
            if (window.progressManager) {
                const completedStages = window.progressManager.getCompletedStages();
                isCompleted = completedStages.includes(stageDay);
            } else {
                // Fallback vers localStorage direct
                const completedStages = JSON.parse(localStorage.getItem('gr10-completed-stages') || '[]');
                isCompleted = completedStages.includes(stageDay);
            }
            checkbox.checked = isCompleted;
        }
    }

    handleStageCompletion(stageDay, completed) {
        // Sauvegarder l'état avec progressManager si disponible
        if (window.progressManager) {
            const completedStages = window.progressManager.getCompletedStages();
            const isCurrentlyCompleted = completedStages.includes(stageDay);
            
            // Ne faire l'action que si l'état change
            if (isCurrentlyCompleted !== completed) {
                window.progressManager.toggleStageCompletion(stageDay);
            }
        } else {
            // Fallback vers localStorage direct
            const completedStages = JSON.parse(localStorage.getItem('gr10-completed-stages') || '[]');
            const index = completedStages.indexOf(stageDay);
            
            if (completed && index === -1) {
                completedStages.push(stageDay);
            } else if (!completed && index !== -1) {
                completedStages.splice(index, 1);
            }
            
            localStorage.setItem('gr10-completed-stages', JSON.stringify(completedStages));
        }
        
        // Mettre à jour la carte correspondante
        const stageCard = document.querySelector(`[data-stage-day="${stageDay}"]`);
        if (stageCard) {
            stageCard.classList.toggle('completed', completed);
        }
        
        // Mettre à jour les statistiques si la fonction existe
        if (typeof updateProgressStats === 'function') {
            updateProgressStats();
        }
    }
}

// Instance globale
window.modalManager = new ModalManager();

// Fonction globale pour ouvrir la modale
window.openStageModal = function(day) {
    window.modalManager.openModal(day);
};
