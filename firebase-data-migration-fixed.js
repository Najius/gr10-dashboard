// Script de migration des données GR10 vers Firebase
// Migre les données statiques vers Firestore pour une architecture hybride

async function migrateDataToFirebase() {
    if (!window.firebaseSync) {
        console.error('❌ Firebase non disponible');
        return false;
    }

    if (typeof gr10Data === 'undefined') {
        console.error('❌ Données GR10 non disponibles');
        return false;
    }

    // Vérifier si les données existent déjà
    try {
        const existingStages = await window.firebaseSync.getStages();
        if (existingStages && existingStages.length > 0) {
            const confirm = window.confirm(`${existingStages.length} étapes existent déjà dans Firebase. Voulez-vous les remplacer ?`);
            if (!confirm) {
                console.log('⏹️ Migration annulée par l\'utilisateur');
                return false;
            }
        }
    } catch (error) {
        console.log('⚠️ Impossible de vérifier les données existantes, poursuite de la migration...');
    }

    try {
        console.log('🚀 Début de la migration vers Firebase...');
        console.log(`📊 ${gr10Data.length} étapes à migrer`);
        
        let successCount = 0;
        const totalStages = gr10Data.length;

        for (const stage of gr10Data) {
            try {
                // Ajouter un timestamp de migration
                const stageWithTimestamp = {
                    ...stage,
                    lastUpdated: new Date(),
                    migratedAt: new Date()
                };

                await window.firebaseSync.saveStage(stage.etape, stageWithTimestamp);
                successCount++;
                
                // Afficher le progrès tous les 5 étapes
                if (successCount % 5 === 0 || successCount === totalStages) {
                    console.log(`✅ Progrès: ${successCount}/${totalStages} étapes migrées`);
                }
            } catch (error) {
                console.error(`❌ Erreur étape ${stage.etape}:`, error);
            }
        }

        if (successCount === totalStages) {
            console.log('🎉 Migration réussie ! Toutes les étapes ont été migrées');
            
            // Vérification immédiate
            setTimeout(async () => {
                try {
                    const verifyStages = await window.firebaseSync.getStages();
                    console.log(`✅ Vérification: ${verifyStages.length} étapes dans Firebase`);
                } catch (error) {
                    console.log('⚠️ Erreur lors de la vérification:', error);
                }
            }, 1000);
            
            return true;
        } else {
            console.log(`⚠️ Migration partielle: ${successCount}/${totalStages} étapes migrées`);
            return false;
        }

    } catch (error) {
        console.error('❌ Erreur migration:', error);
        return false;
    }
}

// Classe pour gérer la migration
class GR10DataMigration {
    constructor() {
        this.init();
    }

    init() {
        // Attendre que Firebase soit prêt
        const checkFirebase = () => {
            if (window.firebaseSync) {
                this.showMigrationButton();
            } else {
                setTimeout(checkFirebase, 1000);
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
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = '⏳ Migration en cours...';
            
            const success = await migrateDataToFirebase();
            
            if (success) {
                button.textContent = '✅ Migration réussie !';
                button.style.background = '#10b981';
                setTimeout(() => button.remove(), 3000);
            } else {
                button.textContent = '❌ Erreur migration';
                button.style.background = '#ef4444';
                button.disabled = false;
                setTimeout(() => {
                    button.textContent = '🚀 Migrer les données vers Firebase';
                    button.style.background = '#ff6b35';
                }, 3000);
            }
        });

        document.body.appendChild(button);
    }
}

// Initialiser la migration si on est en mode admin
if (window.location.hash.includes('admin')) {
    window.gr10Migration = new GR10DataMigration();
}
