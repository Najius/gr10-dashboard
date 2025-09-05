// Configuration Firebase pour GR10 Dashboard - Version propre
// Synchronisation temps réel mobile ↔ web

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuration Firebase
const firebaseConfig = {
    apiKey: "ATzaSyDTmIpbqAowDv9XbcGM0j1YCANK9I1",
    authDomain: "gr10-dashboard.firebaseapp.com",
    databaseURL: "https://gr10-dashboard-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "gr10-dashboard",
    storageBucket: "gr10-dashboard.firebasestorage.app",
    messagingSenderId: "989702167215",
    appId: "1:989702167215:web:3b94f2d75394d6c7d62ca"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Classe de gestion Firebase
class FirebaseSync {
    constructor() {
        this.isOnline = true;
        this.db = db;
        this.checkConnection();
    }

    // Vérifier la connexion Firebase
    async checkConnection() {
        try {
            await getDoc(doc(db, 'test', 'connection'));
            this.isOnline = true;
            console.log('✅ Firebase connecté');
        } catch (error) {
            this.isOnline = false;
            console.warn('⚠️ Firebase hors ligne');
        }
    }

    // Sauvegarder le progrès d'une étape
    async saveProgress(stageId, progressData) {
        if (!this.isOnline) return;

        try {
            await setDoc(doc(db, 'gr10-progress', stageId.toString()), {
                ...progressData,
                lastUpdated: new Date(),
                userId: 'anonymous'
            }, { merge: true });
            
            console.log(`Étape ${stageId} sauvegardée dans Firebase`);
        } catch (error) {
            console.error('Erreur sauvegarde Firebase:', error);
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

    // Écouter tous les changements de progrès
    listenToAllProgress(callback) {
        if (!this.isOnline) return;

        return onSnapshot(collection(db, 'gr10-progress'), (snapshot) => {
            const progressData = {};
            snapshot.forEach((doc) => {
                progressData[doc.id] = doc.data();
            });
            callback(progressData);
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
