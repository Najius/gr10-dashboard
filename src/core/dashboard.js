/**
 * GR10Dashboard - Classe principale pour la gestion du dashboard GR10
 * Extrait du HTML pour une architecture modulaire
 */
class GR10Dashboard {
    constructor() {
        this.itineraryData = this.loadGR10Data();
        this.completedStages = new Set();
        this.stageNotes = {};
        this.stageRatings = {};
        this.detailedRatings = {};
        this.stagePhotos = {};
        this.stageTimes = {};
        this.currentStageId = null;
        this.map = null;
        this.stageMap = null;
        this.chart = null;
        this.isAdminMode = localStorage.getItem('gr10-admin-mode') === 'true';
        
        this.loadProgress();
        this.loadSavedData();
        this.init();
    }

    loadSavedData() {
        // Charger les données modifiées depuis localStorage
        const savedData = localStorage.getItem('gr10-itinerary-data');
        if (savedData) {
            try {
                this.itineraryData = JSON.parse(savedData);
            } catch (e) {
                console.error('Erreur lors du chargement des données sauvegardées:', e);
            }
        }
    }

    init() {
        this.renderStages();
        this.updateProgress();
        this.setupEventListeners();
        this.loadCurrentWeather();
        this.updateAnalytics();
        this.updateAdminToggleDisplay();
    }

    // Fonction globale pour ouvrir les modals - nécessaire pour la compatibilité
    openModal(stage) {
        this.currentStageId = stage.etape;
        const modal = document.getElementById('stage-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.populateModal(stage);
        }
    }

    // Fonction globale pour fermer les modals
    closeModal() {
        const modal = document.getElementById('stage-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Fonction pour peupler la modal avec les données de l'étape
    populateModal(stage) {
        console.log('Populating modal with stage:', stage);
        
        // Titre de la modal
        const modalTitle = document.querySelector('#modal-title');
        if (modalTitle) {
            modalTitle.textContent = `Étape ${stage.etape} : ${stage.depart} → ${stage.arrivee}`;
            console.log('Modal title updated');
        } else {
            console.error('Modal title element not found');
        }

        // Onglet Détails
        this.populateDetailsTab(stage);
        
        // Onglet Notes
        this.populateNotesTab(stage);
        
        // Onglet Évaluation
        this.populateRatingTab(stage);
        
        // Onglet Photos
        this.populatePhotosTab(stage);

        // Activer le premier onglet par défaut
        this.switchModalTab('details');
    }

    populateDetailsTab(stage) {
        const detailsContent = document.querySelector('#modal-details-grid');
        if (!detailsContent) {
            console.error('Details content element not found: #modal-details-grid');
            return;
        }
        console.log('Populating details tab for stage:', stage.etape);

        detailsContent.innerHTML = `
            <div class="modal-detail-item">
                <i class="fas fa-route"></i>
                <span class="detail-label">Distance</span>
                <span class="detail-value">${stage.distance} km</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-mountain"></i>
                <span class="detail-label">Dénivelé +</span>
                <span class="detail-value">${stage.denivele_positif} m</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-clock"></i>
                <span class="detail-label">Durée</span>
                <span class="detail-value">${stage.duree}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-signal"></i>
                <span class="detail-label">Difficulté</span>
                <span class="detail-value difficulty-${stage.difficulte?.toLowerCase()}">${stage.difficulte}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-bed"></i>
                <span class="detail-label">Hébergement</span>
                <span class="detail-value">${stage.hebergement}</span>
            </div>
            ${stage.bivouac_b ? `
            <div class="modal-detail-item">
                <i class="fas fa-campground"></i>
                <span class="detail-label">Bivouac alternatif</span>
                <span class="detail-value">${stage.bivouac_b}</span>
            </div>
            ` : ''}
            <div class="modal-detail-item">
                <i class="fas fa-tint"></i>
                <span class="detail-label">Point d'eau</span>
                <span class="detail-value">${stage.eau || 'Non spécifié'}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-shopping-cart"></i>
                <span class="detail-label">Ravitaillement</span>
                <span class="detail-value">${stage.ravitaillement || 'Non disponible'}</span>
            </div>
        `;
    }

    populateNotesTab(stage) {
        const notesContent = document.querySelector('#modal-notes-tab');
        if (!notesContent) return;

        const savedNotes = this.stageNotes[stage.etape] || '';
        
        notesContent.innerHTML = `
            <div class="notes-toolbar">
                <button onclick="dashboard.formatText('bold')" title="Gras"><i class="fas fa-bold"></i></button>
                <button onclick="dashboard.formatText('italic')" title="Italique"><i class="fas fa-italic"></i></button>
                <button onclick="dashboard.formatText('underline')" title="Souligné"><i class="fas fa-underline"></i></button>
                <button onclick="dashboard.insertTemplate()" title="Template"><i class="fas fa-file-alt"></i></button>
            </div>
            <textarea id="stage-notes" placeholder="Vos notes pour cette étape...">${savedNotes}</textarea>
            <button class="btn btn-primary" onclick="dashboard.saveNotes(${stage.etape})">
                <i class="fas fa-save"></i> Sauvegarder les notes
            </button>
        `;
    }

    populateRatingTab(stage) {
        const ratingContent = document.querySelector('#modal-evaluation-tab');
        if (!ratingContent) return;

        const savedRating = this.stageRatings[stage.etape] || 0;
        const detailedRatings = this.detailedRatings[stage.etape] || {};
        const isAdmin = this.isAdminMode;

        if (!isAdmin) {
            ratingContent.innerHTML = `
                <div class="admin-required">
                    <i class="fas fa-lock"></i>
                    <p>Mode admin requis pour éditer les évaluations</p>
                    ${savedRating > 0 ? `
                        <div class="rating-readonly">
                            <h4>Évaluation existante : ${savedRating}/5 étoiles</h4>
                        </div>
                    ` : ''}
                </div>
            `;
            return;
        }

        ratingContent.innerHTML = `
            <div class="rating-section">
                <h4>Évaluation globale</h4>
                <div class="star-rating" data-rating="${savedRating}">
                    ${[1,2,3,4,5].map(i => `<span class="star ${i <= savedRating ? 'active' : ''}" data-value="${i}">★</span>`).join('')}
                </div>
            </div>
            
            <div class="detailed-ratings">
                <h4>Évaluations détaillées</h4>
                ${this.createDetailedRatingSection('Paysage', 'paysage', detailedRatings.paysage || 0)}
                ${this.createDetailedRatingSection('Difficulté technique', 'technique', detailedRatings.technique || 0)}
                ${this.createDetailedRatingSection('Balisage', 'balisage', detailedRatings.balisage || 0)}
                ${this.createDetailedRatingSection('Hébergement', 'hebergement', detailedRatings.hebergement || 0)}
                ${this.createDetailedRatingSection('Météo', 'meteo', detailedRatings.meteo || 0)}
            </div>
            
            <button class="btn btn-primary" onclick="dashboard.saveRatings(${stage.etape})">
                <i class="fas fa-save"></i> Sauvegarder l'évaluation
            </button>
        `;

        // Ajouter les event listeners pour les étoiles
        this.setupStarRatings();
    }

    createDetailedRatingSection(label, key, rating) {
        return `
            <div class="rating-item">
                <label>${label}</label>
                <div class="star-rating detailed" data-category="${key}" data-rating="${rating}">
                    ${[1,2,3,4,5].map(i => `<span class="star ${i <= rating ? 'active' : ''}" data-value="${i}">★</span>`).join('')}
            </div>
        </div>
        
        <div class="detailed-ratings">
            <h4>Évaluations détaillées</h4>
            ${this.createDetailedRatingSection('Paysage', 'paysage', detailedRatings.paysage || 0)}
            ${this.createDetailedRatingSection('Difficulté technique', 'technique', detailedRatings.technique || 0)}
            ${this.createDetailedRatingSection('Balisage', 'balisage', detailedRatings.balisage || 0)}
            ${this.createDetailedRatingSection('Hébergement', 'hebergement', detailedRatings.hebergement || 0)}
            ${this.createDetailedRatingSection('Météo', 'meteo', detailedRatings.meteo || 0)}
        </div>
        
        <button class="btn btn-primary" onclick="dashboard.saveRatings(${stage.etape})">
            <i class="fas fa-save"></i> Sauvegarder l'évaluation
        </button>
    `;
                <i class="fas fa-save"></i> Sauvegarder les notes
            </button>
        `;
    }

    // Fonction pour changer d'onglet dans la modal
    switchModalTab(tabName) {
        // Désactiver tous les onglets
        document.querySelectorAll('.modal-tabs .tab-btn').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
        
        // Activer l'onglet sélectionné
        const activeTab = document.querySelector(`[data-modal-tab="${tabName}"]`);
        const activeContent = document.getElementById(`modal-${tabName}-tab`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

    // Fonctions utilitaires pour les notes
    formatText(command) {
        document.execCommand(command, false, null);
    }

    insertTemplate() {
        const textarea = document.getElementById('stage-notes');
        if (textarea) {
            const template = `
🏔️ CONDITIONS MÉTÉO :
- 

🥾 ÉTAT DU SENTIER :
- 

📍 POINTS REMARQUABLES :
- 

💡 CONSEILS :
- 

⚠️ DIFFICULTÉS RENCONTRÉES :
- 
            `.trim();
            
            textarea.value = template;
        }
    }

    saveNotes(stageId) {
        if (!this.isAdminMode) {
            this.showNotification('Mode admin requis pour éditer les notes', 'error');
            return;
        }
        
        const textarea = document.getElementById('stage-notes');
        if (textarea) {
            this.stageNotes[stageId] = textarea.value;
            localStorage.setItem('gr10-stage-notes', JSON.stringify(this.stageNotes));
            this.showNotification('Notes sauvegardées !');
        }
    }

    // Fonctions pour les ratings
    setupStarRatings() {
        document.querySelectorAll('.star-rating .star').forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.value);
                const ratingContainer = e.target.closest('.star-rating');
                const category = ratingContainer.dataset.category;
                
                // Mettre à jour l'affichage
                ratingContainer.querySelectorAll('.star').forEach((s, index) => {
                    s.classList.toggle('active', index < rating);
                });
                
                // Sauvegarder temporairement
                ratingContainer.dataset.rating = rating;
            });
        });
    }

    saveRatings(stageId) {
        // Sauvegarder l'évaluation globale
        const globalRating = document.querySelector('.star-rating:not(.detailed)');
        if (globalRating) {
            this.stageRatings[stageId] = parseInt(globalRating.dataset.rating) || 0;
        }

        // Sauvegarder les évaluations détaillées
        const detailedRatings = {};
        document.querySelectorAll('.star-rating.detailed').forEach(rating => {
            const category = rating.dataset.category;
            const value = parseInt(rating.dataset.rating) || 0;
            detailedRatings[category] = value;
        });
        
        this.detailedRatings[stageId] = detailedRatings;
        
        // Sauvegarder dans localStorage
        localStorage.setItem('gr10-stage-ratings', JSON.stringify(this.stageRatings));
        localStorage.setItem('gr10-detailed-ratings', JSON.stringify(this.detailedRatings));
        
        this.showNotification('Évaluations sauvegardées !');
    }

    // Fonctions pour les photos
    handlePhotoUpload(event, stageId) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (!this.stagePhotos[stageId]) {
                        this.stagePhotos[stageId] = [];
                    }
                    
                    this.stagePhotos[stageId].push({
                        url: e.target.result,
                        name: file.name,
                        date: new Date().toISOString()
                    });
                    
                    localStorage.setItem('gr10-stage-photos', JSON.stringify(this.stagePhotos));
                    
                    // Recharger l'onglet photos
                    const currentStage = this.itineraryData.find(s => s.etape === stageId);
                    if (currentStage) {
                        this.populatePhotosTab(currentStage);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    deletePhoto(stageId, photoIndex) {
        if (this.stagePhotos[stageId]) {
            this.stagePhotos[stageId].splice(photoIndex, 1);
            localStorage.setItem('gr10-stage-photos', JSON.stringify(this.stagePhotos));
            
            // Recharger l'onglet photos
            const currentStage = this.itineraryData.find(s => s.etape === stageId);
            if (currentStage) {
                this.populatePhotosTab(currentStage);
            }
        }
    }

    openLightbox(imageUrl) {
        const lightbox = document.getElementById('photo-lightbox');
        const lightboxImg = document.getElementById('lightbox-image');
        
        if (lightbox && lightboxImg) {
            lightboxImg.src = imageUrl;
            lightbox.style.display = 'flex';
        }
    }

    closeLightbox() {
        const lightbox = document.getElementById('photo-lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
        }
    }

    // Fonction utilitaire pour les notifications
    showNotification(message) {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color, #10b981);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Charger les données sauvegardées au démarrage
    loadProgress() {
        try {
            const savedCompleted = localStorage.getItem('gr10-completed-stages');
            if (savedCompleted) {
                this.completedStages = new Set(JSON.parse(savedCompleted));
            }
            
            const savedNotes = localStorage.getItem('gr10-stage-notes');
            if (savedNotes) {
                this.stageNotes = JSON.parse(savedNotes);
            }
            
            const savedRatings = localStorage.getItem('gr10-stage-ratings');
            if (savedRatings) {
                this.stageRatings = JSON.parse(savedRatings);
            }
            
            const savedDetailedRatings = localStorage.getItem('gr10-detailed-ratings');
            if (savedDetailedRatings) {
                this.detailedRatings = JSON.parse(savedDetailedRatings);
            }
            
            const savedPhotos = localStorage.getItem('gr10-stage-photos');
            if (savedPhotos) {
                this.stagePhotos = JSON.parse(savedPhotos);
            }
            
            const savedTimes = localStorage.getItem('gr10-stage-times');
            if (savedTimes) {
                this.stageTimes = JSON.parse(savedTimes);
            }
        } catch (e) {
            console.error('Erreur lors du chargement des données:', e);
        }
    }

    // Fonction pour valider une étape
    validateStage(stageId) {
        // Vérifier que l'utilisateur est en mode admin
        if (!this.isAdminMode) {
            this.showNotification('Mode admin requis pour valider les étapes', 'error');
            return;
        }
        
        // Vérifier le séquençage même en mode admin
        const nextExpectedStage = Math.max(...this.completedStages, 0) + 1;
        if (stageId !== nextExpectedStage) {
            this.showNotification(`Vous devez valider les étapes dans l'ordre. Prochaine étape : ${nextExpectedStage}`, 'error');
            return;
        }
        
        this.completedStages.add(stageId);
        localStorage.setItem('gr10-completed-stages', JSON.stringify([...this.completedStages]));
        
        // Mettre à jour l'affichage
        this.renderStages();
        this.updateProgress();
        this.updateAnalytics();
        
        this.showNotification(`Étape ${stageId} validée !`);
    }

    // Fonction pour annuler la validation d'une étape
    unvalidateStage(stageId) {
        // Vérifier que l'utilisateur est en mode admin
        if (!this.isAdminMode) {
            this.showNotification('Mode admin requis pour modifier les validations', 'error');
            return;
        }
        
        this.completedStages.delete(stageId);
        localStorage.setItem('gr10-completed-stages', JSON.stringify([...this.completedStages]));
        
        // Mettre à jour l'affichage
        this.renderStages();
        this.updateProgress();
        this.updateAnalytics();
        
        this.showNotification(`Validation de l'étape ${stageId} annulée`);
    }

    // Fonction pour basculer le mode admin
    toggleAdminMode() {
        const password = prompt('Mot de passe admin :');
        if (password === 'gr10admin2025') {
            this.isAdminMode = !this.isAdminMode;
            localStorage.setItem('gr10-admin-mode', this.isAdminMode);
            
            const adminToggle = document.getElementById('admin-toggle');
            if (adminToggle) {
                adminToggle.textContent = this.isAdminMode ? 'Admin ON' : 'Admin';
                adminToggle.style.backgroundColor = this.isAdminMode ? '#e74c3c' : '';
            }
            
            this.renderStages();
            this.showNotification(`Mode admin ${this.isAdminMode ? 'activé' : 'désactivé'}`);
        } else if (password !== null) {
            this.showNotification('Mot de passe incorrect', 'error');
        }
    }

    // Mettre à jour l'affichage du bouton admin
    updateAdminToggleDisplay() {
        const adminToggle = document.getElementById('admin-toggle');
        if (adminToggle) {
            adminToggle.textContent = this.isAdminMode ? 'Admin ON' : 'Admin';
            adminToggle.style.backgroundColor = this.isAdminMode ? '#e74c3c' : '';
        }
    }

    // Fonctions de rendu et mise à jour
    renderStages() {
        console.log('renderStages() appelée');
        const container = document.getElementById('stages-container');
        if (!container) {
            console.error('Container stages-container non trouvé');
            return;
        }
        console.log('Container trouvé:', container);
        console.log('Nombre d\'étapes à afficher:', this.itineraryData.length);

        container.innerHTML = '';
        
        this.itineraryData.forEach((stage, index) => {
            console.log(`Création de la carte pour l'étape ${stage.etape}`);
            const isCompleted = this.completedStages.has(stage.etape);
            const isAdmin = this.isAdminMode;
            
            const stageCard = document.createElement('div');
            stageCard.className = `stage-card ${isCompleted ? 'completed' : ''}`;
            stageCard.dataset.day = stage.etape;
            
            stageCard.innerHTML = `
                <div class="stage-header">
                    <h3>Étape ${stage.etape} : ${stage.depart} → ${stage.arrivee}</h3>
                    <span class="stage-date">${stage.date}</span>
                </div>
                
                <div class="stage-info">
                    <div class="info-item">
                        <i class="fas fa-route"></i>
                        <span>${stage.distance} km</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-mountain"></i>
                        <span>+${stage.denivele_positif}m</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${stage.duree}</span>
                    </div>
                </div>
                
                <div class="stage-actions">
                    <button class="btn btn-primary" onclick="openModal(${JSON.stringify(stage).replace(/"/g, '&quot;')})">
                        <i class="fas fa-eye"></i> Voir détails
                    </button>
                    ${isAdmin ? `
                        <button class="btn ${isCompleted ? 'btn-secondary' : 'btn-success'}" 
                                onclick="dashboard.${isCompleted ? 'unvalidateStage' : 'validateStage'}(${stage.etape})">
                            <i class="fas ${isCompleted ? 'fa-undo' : 'fa-check'}"></i>
                            ${isCompleted ? 'Annuler' : 'Valider'}
                        </button>
                    ` : ''}
                </div>
            `;
            
            container.appendChild(stageCard);
            console.log(`Carte ${index + 1} ajoutée au container`);
        });
        
        console.log('Toutes les cartes ajoutées. Contenu du container:', container.children.length, 'éléments');
        
        // Mettre à jour le compteur
        this.updateStageCounter();
    }

    updateProgress() {
        const completedCount = this.completedStages.size;
        const totalCount = this.itineraryData.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        // Calculer les totaux
        let totalDistance = 0;
        let totalElevationPos = 0;
        let totalElevationNeg = 0;
        
        this.completedStages.forEach(stageId => {
            const stage = this.itineraryData.find(s => s.etape === stageId);
            if (stage) {
                totalDistance += parseFloat(stage.distance) || 0;
                totalElevationPos += parseInt(stage.denivele_positif) || 0;
                totalElevationNeg += parseInt(stage.denivele_negatif) || 0;
            }
        });
        
        // Mettre à jour l'affichage
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        const elements = {
            'completed-stages': completedCount,
            'remaining-stages': totalCount - completedCount,
            'total-distance': Math.round(totalDistance),
            'total-elevation-positive': totalElevationPos,
            'total-elevation-negative': totalElevationNeg,
            'completion-percentage': `${percentage}%`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    setupEventListeners() {
        // Event listeners pour les onglets principaux
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchMainTab(tabName);
            });
        });
        
        // Event listeners pour les modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
        
        // Event listener pour fermer la lightbox
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeLightbox();
            }
        });
    }

    switchMainTab(tabName) {
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Activer l'onglet sélectionné
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-tab`);
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
        
        // Actions spécifiques selon l'onglet
        if (tabName === 'analytics') {
            this.updateAnalytics();
        }
    }

    loadCurrentWeather() {
        // Météo simulée pour le moment
        const weatherData = {
            location: 'Pyrénées',
            temp: Math.round(15 + Math.random() * 10),
            condition: 'Ensoleillé',
            icon: 'fa-sun',
            wind: Math.round(5 + Math.random() * 15),
            humidity: Math.round(50 + Math.random() * 30),
            visibility: '10'
        };
        
        const elements = {
            'weather-location': weatherData.location,
            'weather-temp': `${weatherData.temp}°C`,
            'weather-desc': weatherData.condition,
            'weather-wind': `${weatherData.wind} km/h`,
            'weather-humidity': `${weatherData.humidity}%`,
            'weather-visibility': `${weatherData.visibility} km`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        const weatherIcon = document.getElementById('weather-icon');
        if (weatherIcon) {
            weatherIcon.innerHTML = `<i class="fas ${weatherData.icon}"></i>`;
        }
    }

    updateAnalytics() {
        const completedCount = this.completedStages.size;
        const totalCount = this.itineraryData.length;
        
        // Calculer les métriques
        const startDate = new Date('2025-09-08');
        const today = new Date();
        const daysElapsed = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, 48 - daysElapsed);
        
        let avgDistance = 0;
        let avgElevation = 0;
        let avgRating = 0;
        let photosCount = 0;
        
        if (completedCount > 0) {
            let totalDistance = 0;
            let totalElevation = 0;
            let totalRating = 0;
            let ratedStages = 0;
            
            this.completedStages.forEach(stageId => {
                const stage = this.itineraryData.find(s => s.etape === stageId);
                if (stage) {
                    totalDistance += parseFloat(stage.distance) || 0;
                    totalElevation += parseInt(stage.denivele_positif) || 0;
                }
                
                if (this.stageRatings[stageId]) {
                    totalRating += this.stageRatings[stageId];
                    ratedStages++;
                }
                
                if (this.stagePhotos[stageId]) {
                    photosCount += this.stagePhotos[stageId].length;
                }
            });
            
            avgDistance = Math.round(totalDistance / completedCount);
            avgElevation = Math.round(totalElevation / completedCount);
            avgRating = ratedStages > 0 ? (totalRating / ratedStages).toFixed(1) : 0;
        }
        
        // Mettre à jour l'affichage des analytics
        const analyticsElements = {
            'days-elapsed': daysElapsed,
            'days-remaining': daysRemaining,
            'average-pace': completedCount > 0 ? `${(completedCount / Math.max(1, daysElapsed)).toFixed(1)} étapes/jour` : '1 étape/jour',
            'avg-distance': `${avgDistance} km`,
            'avg-elevation': `${avgElevation} m`,
            'avg-difficulty': this.getAverageDifficulty(),
            'avg-rating': avgRating > 0 ? `${avgRating}/5` : 'Aucune',
            'rated-stages': Object.keys(this.stageRatings).length,
            'photos-count': photosCount
        };
        
        Object.entries(analyticsElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    getAverageDifficulty() {
        if (this.completedStages.size === 0) return 'Aucune';
        
        const difficulties = { 'Simple': 1, 'Moyenne': 2, 'Difficile': 3 };
        let totalDifficulty = 0;
        let count = 0;
        
        this.completedStages.forEach(stageId => {
            const stage = this.itineraryData.find(s => s.etape === stageId);
            if (stage && difficulties[stage.difficulte]) {
                totalDifficulty += difficulties[stage.difficulte];
                count++;
            }
        });
        
        if (count === 0) return 'Aucune';
        
        const avg = totalDifficulty / count;
        if (avg <= 1.3) return 'Simple';
        if (avg <= 2.3) return 'Moyenne';
        return 'Difficile';
    }

    // Données de fallback
    loadGR10Data() {
        // Utiliser les données des fichiers externes si disponibles
        if (typeof gr10DataPart1 !== 'undefined' && typeof gr10DataPart2 !== 'undefined') {
            return [...gr10DataPart1, ...gr10DataPart2];
        }
        
        // Données de fallback simplifiées
        return [
            { etape: 1, date: "2025-09-08", depart: "Hendaye", arrivee: "Ibardin", distance: 15, denivele_positif: 850, denivele_negatif: 450, duree: "6h", difficulte: "Moyenne", terrain: "forêt/colline, sentier parfois caillouteux", hebergement: "Gîte Ibardin", bivouac_b: "replat boisé 1–2 km avant le col", eau: "Fontaine/commerce Ibardin", ravitaillement: "—", altitude: 317, exposition: "variable (vallée/forêt)", reseau: "variable" },
            { etape: 2, date: "2025-09-09", depart: "Ibardin", arrivee: "Sare", distance: 16.5, denivele_positif: 700, denivele_negatif: 1000, duree: "6.5h", difficulte: "Difficile", terrain: "forêt ombragée, pistes et sentier", hebergement: "Hébergement Sare", bivouac_b: "clairière avant Sare", eau: "Fontaine du bourg de Sare", ravitaillement: "épicerie/boulangerie", altitude: 700, exposition: "variable (vallée/forêt)", reseau: "souvent bon (vallée/ville)" },
            { etape: 3, date: "2025-09-10", depart: "Sare", arrivee: "Col des Veaux", distance: 16, denivele_positif: 600, denivele_negatif: 200, duree: "5.7h", difficulte: "Simple", terrain: "crête herbeuse, quelques passages rocheux", hebergement: "Auberge Col des Veaux", bivouac_b: "replat côté ouest sous la crête", eau: "Source de crête (à confirmer)", ravitaillement: "—", altitude: 493, exposition: "vent/soleil (crête)", reseau: "variable" }
        ];
    }
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GR10Dashboard;
}
