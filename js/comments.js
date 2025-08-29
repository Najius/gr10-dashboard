// Module de gestion des commentaires
class CommentsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Bouton de soumission de commentaire
        document.addEventListener('click', (e) => {
            if (e.target.closest('#submit-comment')) {
                this.submitComment();
            }
        });

        // Validation en temps réel
        document.addEventListener('input', (e) => {
            if (e.target.id === 'comment-text') {
                this.updateCharacterCount(e.target);
            }
        });

        // Entrée pour soumettre
        document.addEventListener('keydown', (e) => {
            if (e.target.id === 'comment-text' && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.submitComment();
            }
        });
    }

    updateCharacterCount(textarea) {
        const maxLength = 500;
        const currentLength = textarea.value.length;
        const remaining = maxLength - currentLength;
        
        const hint = textarea.parentElement.querySelector('.form-hint');
        if (hint) {
            hint.textContent = `${remaining} caractères restants`;
            hint.style.color = remaining < 50 ? '#ef4444' : '#6b7280';
        }
    }

    submitComment() {
        const nameInput = document.getElementById('commenter-name');
        const textInput = document.getElementById('comment-text');
        const submitBtn = document.getElementById('submit-comment');
        
        if (!nameInput || !textInput || !submitBtn) return;

        const name = nameInput.value.trim();
        const text = textInput.value.trim();

        // Validation
        if (!name) {
            this.showError('Veuillez saisir votre nom');
            nameInput.focus();
            return;
        }

        if (!text) {
            this.showError('Veuillez saisir un commentaire');
            textInput.focus();
            return;
        }

        if (name.length > 50) {
            this.showError('Le nom ne peut pas dépasser 50 caractères');
            nameInput.focus();
            return;
        }

        if (text.length > 500) {
            this.showError('Le commentaire ne peut pas dépasser 500 caractères');
            textInput.focus();
            return;
        }

        // Créer le commentaire
        const comment = {
            id: Date.now().toString(),
            author: name,
            text: text,
            date: new Date().toISOString(),
            stageDay: window.publicModalManager?.currentStage || 1
        };

        // Sauvegarder
        this.saveComment(comment);

        // Réinitialiser le formulaire
        nameInput.value = '';
        textInput.value = '';
        this.updateCharacterCount(textInput);

        // Recharger les commentaires
        if (window.publicModalManager) {
            window.publicModalManager.loadComments(comment.stageDay);
        }

        // Feedback
        this.showSuccess('Commentaire publié avec succès !');
    }

    saveComment(comment) {
        const stageDay = comment.stageDay;
        const storageKey = `stage_comments_${stageDay}`;
        const existingComments = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        existingComments.push(comment);
        
        // Trier par date (plus récent en premier)
        existingComments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        localStorage.setItem(storageKey, JSON.stringify(existingComments));
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        // Supprimer les anciens toasts
        const existingToasts = document.querySelectorAll('.comment-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `comment-toast toast-${type}`;
        
        const icon = type === 'success' ? 'fas fa-check' : 
                    type === 'error' ? 'fas fa-exclamation-triangle' : 
                    'fas fa-info';
        
        toast.innerHTML = `<i class="${icon}"></i> ${message}`;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Instance globale
window.commentsManager = new CommentsManager();
