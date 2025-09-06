// Configuration Firebase pour GR10 Dashboard - Version propre
// Synchronisation temps réel mobile ↔ web

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, getDocs, addDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuration Firebase - Créer un nouveau projet Firebase
const firebaseConfig = {
    apiKey: "REMPLACER_PAR_VOTRE_API_KEY",
    authDomain: "VOTRE_PROJET.firebaseapp.com",
    projectId: "VOTRE_PROJET_ID",
    storageBucket: "VOTRE_PROJET.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Classe de gestion Firebase
class FirebaseSync {
    constructor() {
        this.isOnline = false;
        this.db = db;
        this.testConnection();
    }

    async testConnection() {
        try {
            // Test simple de connexion à Firestore
            const testDoc = doc(db, 'test', 'connection');
            await getDoc(testDoc);
            this.isOnline = true;
            console.log('✅ Firebase connecté et opérationnel');
        } catch (error) {
            this.isOnline = false;
            console.error('❌ Firebase connexion échouée:', error.message, error.code);
            console.warn('⚠️ Mode hors ligne activé');
        }
    }

    // Sauvegarder le progrès d'une étape
    async saveProgress(stageId, progressData) {
        if (!this.isOnline) return false;

        try {
            // Convertir les photos en base64 si nécessaire pour Firebase
            let processedData = { ...progressData };
            if (progressData.photos && Array.isArray(progressData.photos)) {
                processedData.photos = progressData.photos.map(photo => {
                    if (typeof photo === 'object' && photo.data) {
                        return {
                            ...photo,
                            data: photo.data // Garder les données base64
                        };
                    }
                    return photo;
                });
            }

            await setDoc(doc(db, 'gr10-progress', stageId.toString()), {
                ...processedData,
                lastUpdated: new Date(),
                timestamp: Date.now(),
                userId: 'anonymous'
            }, { merge: true });
            
            console.log(`📤 Étape ${stageId} sauvegardée dans Firebase avec ${progressData.photos?.length || 0} photos`);
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde Firebase:', error);
            return false;
        }
    }

    // Sauvegarder toutes les données utilisateur d'un coup
    async saveAllUserData(allData) {
        if (!this.isOnline) return false;

        try {
            const batch = writeBatch(db);
            
            // Sauvegarder toutes les étapes (y compris celles avec completed: false pour les suppressions)
            for (const [stageId, stageData] of Object.entries(allData)) {
                const docRef = doc(db, 'gr10-progress', stageId.toString());
                batch.set(docRef, {
                    ...stageData,
                    lastUpdated: new Date(),
                    timestamp: Date.now(),
                    userId: 'anonymous'
                }, { merge: true });
            }
            
            await batch.commit();
            console.log('📤 Toutes les données sauvegardées dans Firebase');
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde batch Firebase:', error);
            console.error('Détails de l\'erreur:', error.message, error.code);
            return false;
        }
    }

    // Sauvegarder une étape complète dans Firebase
    async saveStage(stageNumber, stageData) {
        if (!this.isOnline) {
            console.warn('Mode hors ligne, sauvegarde impossible');
            return false;
        }

        try {
            const stageRef = doc(db, 'gr10-stages', `stage-${stageNumber}`);
            await setDoc(stageRef, {
                ...stageData,
                lastUpdated: new Date()
            });
            console.log(`Étape ${stageNumber} sauvegardée dans Firebase`);
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde étape:', error);
            throw error;
        }
    }

    // Récupérer toutes les étapes depuis Firebase
    async getStages() {
        if (!this.isOnline) {
            return null;
        }

        try {
            const querySnapshot = await getDocs(collection(db, 'gr10-stages'));
            const stages = [];
            querySnapshot.forEach((doc) => {
                stages.push({ id: doc.id, ...doc.data() });
            });
            
            // Trier par numéro d'étape
            stages.sort((a, b) => a.etape - b.etape);
            console.log(`${stages.length} étapes récupérées depuis Firebase`);
            return stages;
        } catch (error) {
            console.error('Erreur récupération étapes:', error);
            return null;
        }
    }

    // Écouter les changements en temps réel sur les étapes
    listenToStagesChanges(callback) {
        if (!this.isOnline) return;

        try {
            return onSnapshot(collection(db, 'gr10-stages'), (snapshot) => {
                const stages = [];
                snapshot.forEach((doc) => {
                    stages.push({ id: doc.id, ...doc.data() });
                });
                stages.sort((a, b) => a.etape - b.etape);
                callback(stages);
            });
        } catch (error) {
            console.error('Erreur écoute changements:', error);
        }
    }

    // Récupérer le progrès d'une étape
    async getProgress(stageId) {
        if (!this.isOnline) return null;

        try {
            const docSnap = await getDoc(doc(db, 'gr10-progress', stageId.toString()));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error('Erreur récupération progrès:', error);
            return null;
        }
    }

    // Écouter les changements de progrès en temps réel
    listenToProgress(stageId, callback) {
        if (!this.isOnline) return;

        return onSnapshot(doc(db, 'gr10-progress', stageId.toString()), (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            }
        });
    }

    // Écouter tous les changements en temps réel
    listenToAllProgress(callback) {
        if (!this.isOnline) return;

        return onSnapshot(collection(db, 'gr10-progress'), (snapshot) => {
            const allData = {};
            snapshot.forEach((doc) => {
                allData[doc.id] = doc.data();
            });
            callback(allData);
        });
    }

    // Mettre à jour une étape existante
    async updateStage(stageNumber, updates) {
        if (!this.isOnline) return false;

        try {
            const stageRef = doc(db, 'gr10-stages', `stage-${stageNumber}`);
            await updateDoc(stageRef, {
                ...updates,
                lastUpdated: new Date()
            });
            console.log(`Étape ${stageNumber} mise à jour`);
            return true;
        } catch (error) {
            console.error('Erreur mise à jour étape:', error);
            return false;
        }
    }
}

// Créer l'instance globale
window.firebaseSync = new FirebaseSync();

// Export pour utilisation en module
export { FirebaseSync, db };
