// Script de migration des données GR10 vers Firebase Firestore
// Exécuter une seule fois pour peupler la base de données

class GR10DataMigration {
    constructor() {
        this.firebaseSync = null;
        this.initializeWhenReady();
    }

    initializeWhenReady() {
        const checkFirebase = () => {
            if (window.firebaseSync && typeof gr10Data !== 'undefined') {
                this.firebaseSync = window.firebaseSync;
                console.log('🔥 Migration Firebase prête');
                this.showMigrationButton();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    showMigrationButton() {
        // Créer un bouton de migration temporaire
        const button = document.createElement('button');
        button.textContent = '🚀 Migrer les données vers Firebase';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 10px 20px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;
        button.onclick = () => this.migrateData();
        document.body.appendChild(button);
    }

    async migrateData() {
        try {
            console.log('🚀 Début de la migration des données...');
            
            // Vérifier si les données existent déjà
            const existingStages = await this.firebaseSync.getStages();
            if (existingStages && existingStages.length > 0) {
                if (!confirm('Des données existent déjà. Voulez-vous les remplacer ?')) {
                    return;
                }
            }

            // Migrer chaque étape
            for (const stage of gr10Data) {
                await this.firebaseSync.saveStage(stage);
                console.log(`✅ Étape ${stage.etape} migrée`);
            }

            console.log('🎉 Migration terminée avec succès !');
            alert(`Migration réussie ! ${gr10Data.length} étapes ont été sauvegardées dans Firebase.`);
            
            // Supprimer le bouton
            document.querySelector('button').remove();
            
        } catch (error) {
            console.error('❌ Erreur lors de la migration:', error);
            alert('Erreur lors de la migration. Voir la console pour plus de détails.');
        }
    }
}

// Initialiser la migration si on est en mode admin
if (window.location.hash.includes('admin')) {
    window.gr10Migration = new GR10DataMigration();
}
