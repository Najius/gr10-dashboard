/**
 * Fonctions globales pour la compatibilité avec l'ancien système
 * Ces fonctions font le pont entre l'ancienne architecture et la nouvelle
 */

// Fonction globale pour ouvrir les modals
function openModal(stage) {
    if (window.dashboard) {
        window.dashboard.openModal(stage);
    } else {
        console.error('Dashboard non initialisé');
    }
}

// Fonction globale pour fermer les modals
function closeModal() {
    if (window.dashboard) {
        window.dashboard.closeModal();
    }
}

// Fonction pour changer d'onglet dans les modals
function switchModalTab(tabName) {
    if (window.dashboard) {
        window.dashboard.switchModalTab(tabName);
    }
}

// Fonction pour valider une étape
function validateStage(stageId) {
    if (window.dashboard) {
        window.dashboard.validateStage(stageId);
    }
}

// Fonction pour annuler la validation d'une étape
function unvalidateStage(stageId) {
    if (window.dashboard) {
        window.dashboard.unvalidateStage(stageId);
    }
}

// Fonction pour ouvrir la lightbox des photos
function openLightbox(imageUrl) {
    if (window.dashboard) {
        window.dashboard.openLightbox(imageUrl);
    }
}

// Fonction pour fermer la lightbox
function closeLightbox() {
    if (window.dashboard) {
        window.dashboard.closeLightbox();
    }
}

// Fonction pour supprimer une photo
function deletePhoto(stageId, photoIndex) {
    if (window.dashboard) {
        window.dashboard.deletePhoto(stageId, photoIndex);
    }
}

// Fonction pour sauvegarder les notes
function saveNotes(stageId) {
    if (window.dashboard) {
        window.dashboard.saveNotes(stageId);
    }
}

// Fonction pour sauvegarder les évaluations
function saveRatings(stageId) {
    if (window.dashboard) {
        window.dashboard.saveRatings(stageId);
    }
}

// Fonction pour formater le texte dans les notes
function formatText(command) {
    if (window.dashboard) {
        window.dashboard.formatText(command);
    }
}

// Fonction pour insérer un template dans les notes
function insertTemplate() {
    if (window.dashboard) {
        window.dashboard.insertTemplate();
    }
}

// Fonction pour basculer le mode admin
function toggleAdminMode() {
    const password = prompt('Mot de passe admin :');
    if (password === 'gr10admin2025') {
        document.body.classList.toggle('admin-mode');
        const isAdmin = document.body.classList.contains('admin-mode');
        localStorage.setItem('gr10-admin-mode', isAdmin);
        
        if (window.dashboard) {
            window.dashboard.isAdminMode = isAdmin;
        }
        
        // Mettre à jour l'affichage
        if (window.dashboard && window.dashboard.renderStages) {
            window.dashboard.renderStages();
        }
        
        showNotification(isAdmin ? 'Mode admin activé' : 'Mode admin désactivé');
    } else if (password !== null) {
        showNotification('Mot de passe incorrect', 'error');
    }
}

// Fonction pour afficher les notifications
function showNotification(message, type = 'success') {
    if (window.dashboard) {
        window.dashboard.showNotification(message);
    } else {
        // Fallback si le dashboard n'est pas disponible
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
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
}

// Fonction pour naviguer entre les onglets principaux
function switchTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    // Actions spécifiques selon l'onglet
    switch(tabName) {
        case 'analytics':
            if (window.dashboard && window.dashboard.updateAnalytics) {
                window.dashboard.updateAnalytics();
            }
            break;
        case 'map':
            // Initialiser la carte si nécessaire
            setTimeout(() => {
                if (window.dashboard && window.dashboard.initMap) {
                    window.dashboard.initMap();
                }
            }, 100);
            break;
    }
}

// Fonction pour sauvegarder le temps réalisé d'une étape
function saveStageTime(stageId) {
    const timeInput = document.getElementById(`time-input-${stageId}`);
    if (timeInput && window.dashboard) {
        const time = timeInput.value;
        if (time) {
            window.dashboard.stageTimes[stageId] = time;
            localStorage.setItem('gr10-stage-times', JSON.stringify(window.dashboard.stageTimes));
            
            // Mettre à jour l'affichage
            const timeDisplay = document.getElementById(`time-display-${stageId}`);
            if (timeDisplay) {
                timeDisplay.textContent = time;
                timeDisplay.style.display = 'inline';
                timeInput.style.display = 'none';
            }
            
            showNotification('Temps sauvegardé !');
        }
    }
}

// Fonction pour éditer le temps réalisé
function editStageTime(stageId) {
    const timeDisplay = document.getElementById(`time-display-${stageId}`);
    const timeInput = document.getElementById(`time-input-${stageId}`);
    
    if (timeDisplay && timeInput) {
        timeDisplay.style.display = 'none';
        timeInput.style.display = 'inline';
        timeInput.focus();
    }
}

// Initialiser le mode admin au chargement si sauvegardé
document.addEventListener('DOMContentLoaded', () => {
    const savedAdminMode = localStorage.getItem('gr10-admin-mode');
    if (savedAdminMode === 'true') {
        document.body.classList.add('admin-mode');
        if (window.dashboard) {
            window.dashboard.isAdminMode = true;
        }
    }
});

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openModal,
        closeModal,
        switchModalTab,
        validateStage,
        unvalidateStage,
        openLightbox,
        closeLightbox,
        deletePhoto,
        saveNotes,
        saveRatings,
        formatText,
        insertTemplate,
        toggleAdminMode,
        showNotification,
        switchTab,
        saveStageTime,
        editStageTime
    };
}
