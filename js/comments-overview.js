// Gestionnaire pour l'onglet de vue d'ensemble des commentaires
class CommentsOverview {
    constructor() {
        this.setupSectionNavigation();
        this.loadAllComments();
    }

    setupSectionNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetSection = e.target.closest('.nav-btn').dataset.section;
                this.switchSection(targetSection);
            });
        });
    }

    switchSection(sectionName) {
        // Mettre à jour les boutons de navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });

        // Mettre à jour les sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}-section`);
        });

        // Charger les commentaires si on bascule vers cette section
        if (sectionName === 'comments') {
            this.loadAllComments();
        } else if (sectionName === 'analytics') {
            // Recharger les analytics quand on bascule vers cette section
            if (window.analytics) {
                window.analytics.loadAnalytics();
            }
        }
    }

    loadAllComments() {
        const container = document.getElementById('all-comments-container');
        if (!container) return;

        const allComments = this.getAllCommentsFromStorage();
        
        if (Object.keys(allComments).length === 0) {
            container.innerHTML = this.generateNoCommentsMessage();
            return;
        }

        container.innerHTML = this.generateCommentsOverview(allComments);
    }

    getAllCommentsFromStorage() {
        const allComments = {};
        
        // Parcourir le localStorage pour trouver tous les commentaires
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('stage_comments_')) {
                const stageDay = parseInt(key.replace('stage_comments_', ''));
                const comments = JSON.parse(localStorage.getItem(key) || '[]');
                if (comments.length > 0) {
                    allComments[stageDay] = comments;
                }
            }
        }
        
        return allComments;
    }

    generateNoCommentsMessage() {
        return `
            <div class="no-comments-global">
                <i class="fas fa-comments" style="font-size: 64px; color: var(--text-secondary); margin-bottom: var(--space-lg);"></i>
                <h3>Aucun commentaire pour le moment</h3>
                <p>Les commentaires laissés par les visiteurs apparaîtront ici.</p>
                <p>Consultez les étapes individuelles pour laisser le premier commentaire !</p>
            </div>
        `;
    }

    generateCommentsOverview(allComments) {
        const sortedStages = Object.keys(allComments).sort((a, b) => parseInt(a) - parseInt(b));
        
        return sortedStages.map(stageDay => {
            const comments = allComments[stageDay];
            const stageInfo = this.getStageInfo(parseInt(stageDay));
            
            return `
                <div class="stage-comments-group">
                    <div class="stage-comments-header">
                        <div class="stage-number-badge">${stageDay}</div>
                        <div class="stage-title-info">
                            <h3>${stageInfo.title}</h3>
                            <p>${stageInfo.date}</p>
                        </div>
                        <div class="comments-count">
                            ${comments.length} commentaire${comments.length > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="stage-comments-list">
                        ${comments.map(comment => this.generateCommentCard(comment)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    getStageInfo(stageDay) {
        if (window.itineraryData) {
            const stage = window.itineraryData.find(s => s.day === stageDay);
            if (stage) {
                return {
                    title: `${stage.from} → ${stage.to}`,
                    date: stage.date
                };
            }
        }
        
        return {
            title: `Étape ${stageDay}`,
            date: 'Date inconnue'
        };
    }

    generateCommentCard(comment) {
        const date = new Date(comment.timestamp);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="comment-card">
                <div class="comment-header">
                    <div class="comment-author">
                        <i class="fas fa-user-circle"></i>
                        <strong>${comment.author}</strong>
                    </div>
                    <div class="comment-date">${formattedDate}</div>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `;
    }
}

// Initialiser la vue d'ensemble des commentaires
document.addEventListener('DOMContentLoaded', () => {
    window.commentsOverview = new CommentsOverview();
});
