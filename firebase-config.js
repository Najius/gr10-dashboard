// Configuration Firebase pour GR10 Dashboard
// Synchronisation temps réel mobile ↔ web

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gestionnaire de synchronisation Firebase
class FirebaseSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupConnectionListener();
    }

    // Écouter les changements de connexion
    setupConnectionListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🟢 Connexion rétablie - Synchronisation...');
            this.syncLocalChanges();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🔴 Hors ligne - Mode cache activé');
        });
    }

    // Sauvegarder la progression d'une étape
    async saveStageProgress(stageId, data) {
        try {
            if (this.isOnline) {
                await setDoc(doc(db, 'gr10-progress', `stage-${stageId}`), {
                    ...data,
                    lastUpdated: new Date(),
                    stageId: stageId
                });
                console.log(`✅ Étape ${stageId} synchronisée`);
            }
            
            // Toujours sauvegarder localement
            this.saveToLocalStorage(`stage-${stageId}`, data);
        } catch (error) {
            console.error('❌ Erreur sync Firebase:', error);
            // Fallback sur localStorage
            this.saveToLocalStorage(`stage-${stageId}`, data);
        }
    }

    // Sauvegarder les données générales du voyage
    async saveTripData(data) {
        try {
            if (this.isOnline) {
                await setDoc(doc(db, 'gr10-trip', 'current'), {
                    ...data,
                    lastUpdated: new Date()
                });
                console.log('✅ Données voyage synchronisées');
            }
            
            this.saveToLocalStorage('trip-data', data);
        } catch (error) {
            console.error('❌ Erreur sync voyage:', error);
            this.saveToLocalStorage('trip-data', data);
        }
    }

    // Écouter les changements en temps réel
    listenToChanges(callback) {
        if (!this.isOnline) return;

        try {
            // Écouter les changements de progression
            onSnapshot(collection(db, 'gr10-progress'), (snapshot) => {
                const changes = [];
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        changes.push({
                            id: change.doc.id,
                            data: change.doc.data()
                        });
                    }
                });
                
                if (changes.length > 0) {
                    console.log('🔄 Changements reçus:', changes.length);
                    callback(changes);
                }
            });

            // Écouter les changements du voyage
            onSnapshot(doc(db, 'gr10-trip', 'current'), (doc) => {
                if (doc.exists()) {
                    console.log('🔄 Données voyage mises à jour');
                    callback([{ id: 'trip-data', data: doc.data() }]);
                }
            });
        } catch (error) {
            console.error('❌ Erreur écoute temps réel:', error);
        }
    }

    // Synchroniser les changements locaux
    async syncLocalChanges() {
        const localData = this.getLocalChanges();
        
        for (const [key, data] of Object.entries(localData)) {
            if (key.startsWith('stage-')) {
                await this.saveStageProgress(key.replace('stage-', ''), data);
            } else if (key === 'trip-data') {
                await this.saveTripData(data);
            }
        }
    }

    // Utilitaires localStorage
    saveToLocalStorage(key, data) {
        localStorage.setItem(`firebase-${key}`, JSON.stringify({
            ...data,
            localTimestamp: Date.now()
        }));
    }

    getLocalChanges() {
        const changes = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('firebase-')) {
                const cleanKey = key.replace('firebase-', '');
                changes[cleanKey] = JSON.parse(localStorage.getItem(key));
            }
        }
        return changes;
    }

    // Récupérer les données d'une étape
    async getStageData(stageId) {
        try {
            if (this.isOnline) {
                const docRef = doc(db, 'gr10-progress', `stage-${stageId}`);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    return docSnap.data();
                }
            }
            
            // Fallback localStorage
            const localData = localStorage.getItem(`firebase-stage-${stageId}`);
            return localData ? JSON.parse(localData) : null;
        } catch (error) {
            console.error('❌ Erreur récupération étape:', error);
            return null;
        }
    }

    // Indicateur de statut de connexion
    getConnectionStatus() {
        return {
            online: this.isOnline,
            status: this.isOnline ? 'Synchronisé' : 'Hors ligne'
        };
    }
}

// Export pour utilisation dans l'application
window.FirebaseSync = FirebaseSync;

// Initialisation automatique
window.firebaseSync = new FirebaseSync();

console.log('🔥 Firebase configuré pour GR10 Dashboard');
