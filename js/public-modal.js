// Module de gestion de la modal publique (lecture seule)
class PublicModalManager {
    constructor() {
        this.modal = document.getElementById('stage-modal');
        this.currentPhotos = [];
        this.currentPhotoIndex = 0;
        this.lightboxInitialized = false;
        this.setupEventListeners();
        this.setupTabHandlers();
    }

    setupEventListeners() {
        // Fermeture de la modal
        const closeBtn = this.modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Fermeture en cliquant sur l'overlay
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Fermeture avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    setupTabHandlers() {
        const tabButtons = this.modal.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Mettre à jour les boutons
        const tabButtons = this.modal.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Mettre à jour les contenus
        const tabPanes = this.modal.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });
    }

    openModal(stageData) {
        console.log('Opening modal for stage:', stageData);
        this.currentStage = stageData.day;
        
        // Mettre à jour le titre
        const title = this.modal.querySelector('#modal-title');
        if (title) {
            title.textContent = `Étape ${stageData.day} : ${stageData.from} → ${stageData.to}`;
            console.log('Title updated:', title.textContent);
        }

        // S'assurer que l'onglet détails est actif
        this.switchTab('details');

        // Remplir les détails
        this.fillStageDetails(stageData);
        
        // Charger les notes et évaluation (lecture seule)
        this.loadPublicNotes(stageData.day);
        
        // Charger les photos (lecture seule)
        this.loadPublicPhotos(stageData.day);
        
        // Charger les commentaires
        this.loadComments(stageData.day);

        // Afficher la modal
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('Modal should be visible now');
    }

    closeModal() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Réinitialiser à l'onglet détails
        this.switchTab('details');
    }

    fillStageDetails(stage) {
        const detailsContainer = document.getElementById('modal-details');
        console.log('Details container found:', detailsContainer);
        console.log('Stage data:', stage);
        
        if (!detailsContainer) {
            console.error('modal-details container not found!');
            return;
        }

        const content = this.generatePublicModalContent(stage);
        console.log('Generated content:', content);
        detailsContainer.innerHTML = content;
        console.log('Content inserted, container innerHTML:', detailsContainer.innerHTML);
    }

    generatePublicModalContent(stage) {
        const difficultyIcon = this.getDifficultyIcon(stage.difficulty);
        
        return `
            <div class="grid grid-3">
                <div class="info-item">
                    <i class="fas fa-route info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Distance</strong>
                        <span class="info-item-value">${stage.distance}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-mountain info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Dénivelé</strong>
                        <span class="info-item-value">${stage.elevation}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Durée</strong>
                        <span class="info-item-value">${stage.duration}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="${difficultyIcon} info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Difficulté</strong>
                        <span class="difficulty-badge ${this.getDifficultyClass(stage.difficulty)}">${stage.difficulty}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-tree info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Terrain</strong>
                        <span class="info-item-value">${stage.terrain}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-bed info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Hébergement</strong>
                        <span class="info-item-value">${stage.refuge}</span>
                        ${stage.refugePhone ? `<br><small style="color: var(--text-muted);"><i class="fas fa-phone" style="margin-right: 4px;"></i>${stage.refugePhone}</small>` : ''}
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-tint info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Eau</strong>
                        <span class="info-item-value">${stage.water}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-shopping-cart info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Ravitaillement</strong>
                        <span class="info-item-value">${stage.supplies}</span>
                    </div>
                </div>
                ${stage.network ? `
                <div class="info-item">
                    <i class="fas fa-signal info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Réseau</strong>
                        <span class="info-item-value">${stage.network}</span>
                    </div>
                </div>
                ` : ''}
                ${stage.bivouacA ? `
                <div class="info-item">
                    <i class="fas fa-campground info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Bivouac A</strong>
                        <span class="info-item-value">${stage.bivouacA}</span>
                    </div>
                </div>
                ` : ''}
                ${stage.bivouacB ? `
                <div class="info-item">
                    <i class="fas fa-campground info-item-icon"></i>
                    <div class="info-item-content">
                        <strong class="info-item-label">Bivouac B</strong>
                        <span class="info-item-value">${stage.bivouacB}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    getDifficultyIcon(difficulty) {
        switch(difficulty?.toLowerCase()) {
            case 'simple': return 'fas fa-signal';
            case 'moyenne': return 'fas fa-signal';
            case 'difficile': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-signal';
        }
    }

    getDifficultyClass(difficulty) {
        switch(difficulty?.toLowerCase()) {
            case 'simple': return 'difficulty-easy';
            case 'moyenne': return 'difficulty-medium';
            case 'difficile': return 'difficulty-hard';
            default: return 'difficulty-medium';
        }
    }

    loadPublicNotes(stageDay) {
        // Charger les notes depuis le localStorage (admin)
        const notes = localStorage.getItem(`stage_notes_${stageDay}`);
        const rating = localStorage.getItem(`stage_rating_${stageDay}`);
        
        // Afficher l'évaluation (lecture seule)
        const stars = this.modal.querySelectorAll('.star-rating .star');
        const ratingValue = rating ? parseInt(rating) : 0;
        
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < ratingValue);
        });

        // Afficher les notes (lecture seule)
        const notesContent = document.querySelector('#public-notes-content .notes-content');
        if (notesContent) {
            if (notes && notes.trim()) {
                notesContent.innerHTML = `<div class="notes-text">${notes.replace(/\n/g, '<br>')}</div>`;
            } else {
                notesContent.innerHTML = '<p class="no-notes">Aucune note disponible pour cette étape.</p>';
            }
        }
    }

    loadPublicPhotos(stageDay) {
        // Charger les photos depuis le localStorage (admin)
        const photos = JSON.parse(localStorage.getItem(`stage_photos_${stageDay}`) || '[]');
        const gallery = document.getElementById('photo-gallery');
        const uploadArea = document.querySelector('.upload-area');
        
        if (photos.length > 0) {
            gallery.style.display = 'grid';
            uploadArea.style.display = 'none';
            this.displayPublicPhotos(photos);
        } else {
            gallery.style.display = 'none';
            uploadArea.style.display = 'block';
        }
    }

    displayPublicPhotos(photos) {
        const gallery = document.getElementById('photo-gallery');
        if (!gallery) return;
        
        gallery.innerHTML = photos.map((photo, index) => 
            `<div class="photo-container">
                <img src="${photo}" alt="Photo d'étape" class="gallery-item" data-photo-index="${index}">
            </div>`
        ).join('');
        
        // Stocker les photos pour la lightbox
        this.currentPhotos = photos;
        
        // Ajouter les event listeners pour la lightbox
        setTimeout(() => {
            const galleryItems = gallery.querySelectorAll('.gallery-item');
            galleryItems.forEach((item, index) => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openLightbox(index);
                });
                item.style.cursor = 'pointer';
            });
        }, 100);
    }

    loadComments(stageDay) {
        // Charger les commentaires depuis le localStorage
        const comments = JSON.parse(localStorage.getItem(`stage_comments_${stageDay}`) || '[]');
        this.displayComments(comments);
    }

    displayComments(comments) {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments"><i class="fas fa-comments"></i><p>Aucun commentaire pour cette étape. Soyez le premier à commenter !</p></div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <div class="comment-author">
                        <i class="fas fa-user"></i>
                        ${comment.author}
                    </div>
                    <div class="comment-date">
                        ${new Date(comment.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
                <div class="comment-content">
                    ${comment.text.replace(/\n/g, '<br>')}
                </div>
            </div>
        `).join('');
    }

    openLightbox(photoIndex) {
        if (!this.currentPhotos || this.currentPhotos.length === 0) return;
        
        const lightbox = document.getElementById('photo-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const currentSpan = document.getElementById('lightbox-current');
        const totalSpan = document.getElementById('lightbox-total');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        
        if (!lightbox) return;
        
        this.currentPhotoIndex = photoIndex;
        
        // Mettre à jour l'image et les infos
        if (lightboxImage) lightboxImage.src = this.currentPhotos[photoIndex];
        if (currentSpan) currentSpan.textContent = photoIndex + 1;
        if (totalSpan) totalSpan.textContent = this.currentPhotos.length;
        
        // Gérer les boutons de navigation
        if (prevBtn) prevBtn.disabled = photoIndex === 0;
        if (nextBtn) nextBtn.disabled = photoIndex === this.currentPhotos.length - 1;
        
        // Afficher la lightbox
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
        
        // Fermeture
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeLightbox());
        }
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });
        
        // Navigation
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPhoto());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPhoto());
        }
        
        // Clavier
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('show')) return;
            
            switch(e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.previousPhoto();
                    break;
                case 'ArrowRight':
                    this.nextPhoto();
                    break;
            }
        });
        
        this.lightboxInitialized = true;
    }

    closeLightbox() {
        const lightbox = document.getElementById('photo-lightbox');
        if (lightbox) {
            lightbox.classList.remove('show');
            lightbox.style.display = 'none';
        }
    }

    previousPhoto() {
        if (this.currentPhotoIndex > 0) {
            this.openLightbox(this.currentPhotoIndex - 1);
        }
    }

    nextPhoto() {
        if (this.currentPhotoIndex < this.currentPhotos.length - 1) {
            this.openLightbox(this.currentPhotoIndex + 1);
        }
    }
}

// Initialiser le gestionnaire de modal quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    if (!window.publicModalManager) {
        window.publicModalManager = new PublicModalManager();
    }
});
