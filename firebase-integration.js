// Intégration Firebase avec GR10 Dashboard
// Gestion de la synchronisation temps réel

class GR10FirebaseIntegration {
    constructor() {
        this.firebaseSync = null;
        this.isInitialized = false;
        this.initializeWhenReady();
    }

    // Attendre que Firebase soit chargé
    initializeWhenReady() {
        const checkFirebase = () => {
            if (window.firebaseSync) {
                this.firebaseSync = window.firebaseSync;
                this.isInitialized = true;
                this.setupRealtimeSync();
                this.addConnectionIndicator();
                console.log('🔥 Intégration Firebase activée');
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    // Configuration de la synchronisation temps réel
    setupRealtimeSync() {
        // Écouter les changements depuis Firebase
        this.firebaseSync.listenToChanges((changes) => {
            this.handleRemoteChanges(changes);
        });

        // Intercepter les modifications locales
        this.interceptLocalChanges();
    }

    // Gérer les changements reçus de Firebase
    handleRemoteChanges(changes) {
        changes.forEach(change => {
            if (change.id.startsWith('stage-')) {
                const stageId = parseInt(change.id.replace('stage-', ''));
                this.updateStageUI(stageId, change.data);
            } else if (change.id === 'trip-data') {
                this.updateTripUI(change.data);
            }
        });

        // Notification visuelle
        this.showSyncNotification('Données mises à jour depuis mobile');
    }

    // Intercepter les modifications locales pour les synchroniser
    interceptLocalChanges() {
        // Override de la méthode de sauvegarde des étapes
        const originalSaveProgress = window.saveStageProgress || (() => {});
        window.saveStageProgress = (stageId, data) => {
            // Sauvegarder localement (comportement original)
            originalSaveProgress(stageId, data);
            
            // Synchroniser avec Firebase
            if (this.isInitialized) {
                this.firebaseSync.saveStageProgress(stageId, data);
            }
        };

        // Override pour les modifications admin
        const originalSaveInlineEdit = window.dashboard?.saveInlineEdit;
        if (originalSaveInlineEdit) {
            window.dashboard.saveInlineEdit = (field, newValue, element, suffix) => {
                // Comportement original
                originalSaveInlineEdit.call(window.dashboard, field, newValue, element, suffix);
                
                // Synchroniser les modifications
                const stageId = window.dashboard.currentStageId;
                if (stageId && this.isInitialized) {
                    const stageData = window.dashboard.itineraryData.find(s => s.etape === stageId);
                    if (stageData) {
                        this.firebaseSync.saveStageProgress(stageId, {
                            ...stageData,
                            lastModified: new Date().toISOString(),
                            modifiedBy: 'admin'
                        });
                    }
                }
            };
        }
    }

    // Mettre à jour l'interface pour une étape
    updateStageUI(stageId, data) {
        // Mettre à jour les données locales
        if (window.dashboard && window.dashboard.itineraryData) {
            const stageIndex = window.dashboard.itineraryData.findIndex(s => s.etape === stageId);
            if (stageIndex !== -1) {
                window.dashboard.itineraryData[stageIndex] = { ...window.dashboard.itineraryData[stageIndex], ...data };
            }
        }

        // Rafraîchir l'affichage si l'étape est visible
        const stageCard = document.querySelector(`[data-stage="${stageId}"]`);
        if (stageCard) {
            this.refreshStageCard(stageId, data);
        }

        // Rafraîchir la modal si elle est ouverte pour cette étape
        if (window.dashboard && window.dashboard.currentStageId === stageId) {
            window.dashboard.openModal(stageId);
        }
    }

    // Rafraîchir une carte d'étape
    refreshStageCard(stageId, data) {
        const card = document.querySelector(`[data-stage="${stageId}"]`);
        if (!card) return;

        // Mettre à jour le statut de completion
        if (data.completed !== undefined) {
            card.classList.toggle('completed', data.completed);
        }

        // Mettre à jour les statistiques visibles
        if (data.temps_realise) {
            const tempsElement = card.querySelector('.temps-realise');
            if (tempsElement) {
                tempsElement.textContent = data.temps_realise;
            }
        }

        // Ajouter un indicateur de mise à jour
        card.classList.add('updated');
        setTimeout(() => card.classList.remove('updated'), 2000);
    }

    // Mettre à jour l'interface générale du voyage
    updateTripUI(data) {
        // Mettre à jour les statistiques globales
        if (data.totalDistance) {
            const distanceElement = document.querySelector('.total-distance');
            if (distanceElement) {
                distanceElement.textContent = `${data.totalDistance} km`;
            }
        }

        if (data.currentStage) {
            const currentStageElement = document.querySelector('.current-stage');
            if (currentStageElement) {
                currentStageElement.textContent = `Étape ${data.currentStage}`;
            }
        }
    }

    // Ajouter un indicateur de connexion (désactivé)
    addConnectionIndicator() {
        // Indicateur désactivé - seulement les styles pour les animations
        const style = document.createElement('style');
        style.textContent = `
            .stage-card.updated {
                animation: pulse-update 2s ease;
            }
            
            @keyframes pulse-update {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
        `;
        
        document.head.appendChild(style);

        // Écouter les changements de connexion (pour la logique interne)
        window.addEventListener('online', () => this.updateConnectionIndicator());
        window.addEventListener('offline', () => this.updateConnectionIndicator());
    }

    // Mettre à jour l'indicateur de connexion (désactivé)
    updateConnectionIndicator() {
        // Fonction désactivée - pas d'indicateur visuel
        return;
    }

    // Afficher une notification de synchronisation
    showSyncNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>${message}</span>
        `;

        // Style pour la notification
        const style = document.createElement('style');
        style.textContent = `
            .sync-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(59, 130, 246, 0.95);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                backdrop-filter: blur(10px);
                animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
                z-index: 1001;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;

        if (!document.querySelector('style[data-sync-notifications]')) {
            style.setAttribute('data-sync-notifications', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Méthodes publiques pour l'interface admin
    async syncNow() {
        if (!this.isInitialized) return;
        
        this.updateConnectionIndicator();
        await this.firebaseSync.syncLocalChanges();
        this.showSyncNotification('Synchronisation manuelle effectuée');
    }

    async exportData() {
        if (!this.isInitialized) return null;
        
        const data = {
            stages: {},
            trip: await this.firebaseSync.getStageData('trip') || {}
        };

        // Exporter toutes les étapes
        for (let i = 1; i <= 48; i++) {
            const stageData = await this.firebaseSync.getStageData(i);
            if (stageData) {
                data.stages[i] = stageData;
            }
        }

        return data;
    }
}

// Initialisation automatique
window.gr10Firebase = new GR10FirebaseIntegration();

console.log('🔗 Intégration Firebase GR10 chargée');
