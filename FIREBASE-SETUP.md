# 🔥 Configuration Firebase pour GR10 Dashboard

## 📋 Étapes de configuration

### 1. Créer le projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur "Ajouter un projet"
3. Nom du projet : `gr10-dashboard`
4. Désactiver Google Analytics (optionnel)
5. Créer le projet

### 2. Configurer Firestore Database

1. Dans le menu latéral → **Firestore Database**
2. Cliquer sur "Créer une base de données"
3. Choisir **"Commencer en mode test"** (règles ouvertes pendant 30 jours)
4. Sélectionner la région : `europe-west1` (Belgique)

### 3. Configurer l'application Web

1. Dans **Paramètres du projet** (icône engrenage)
2. Onglet **"Général"**
3. Section **"Vos applications"** → Cliquer sur l'icône Web `</>`
4. Nom de l'app : `GR10 Dashboard`
5. **NE PAS** cocher "Configurer Firebase Hosting"
6. Cliquer sur "Enregistrer l'application"

### 4. Copier la configuration

Firebase va afficher un code comme ceci :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "gr10-dashboard.firebaseapp.com",
  projectId: "gr10-dashboard",
  storageBucket: "gr10-dashboard.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 5. Mettre à jour le fichier de configuration

1. Ouvrir le fichier `firebase-config.js`
2. Remplacer la section configuration par vos vraies valeurs :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_VRAIE_API_KEY",
    authDomain: "gr10-dashboard.firebaseapp.com",
    projectId: "gr10-dashboard", 
    storageBucket: "gr10-dashboard.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

### 6. Configurer les règles de sécurité (optionnel)

Dans **Firestore Database** → **Règles**, remplacer par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre lecture à tous, écriture seulement si authentifié
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 Test de fonctionnement

1. Ouvrir votre site web
2. Ouvrir la console développeur (F12)
3. Vous devriez voir : `🔥 Firebase configuré pour GR10 Dashboard`
4. En haut à droite : indicateur de connexion vert "Synchronisé"

## 📱 Utilisation mobile

1. Ouvrir le même site sur votre téléphone
2. Se connecter en mode admin
3. Modifier une étape → synchronisation automatique
4. Vérifier sur l'ordinateur → mise à jour en temps réel

## 🔧 Fonctionnalités activées

✅ **Synchronisation temps réel** mobile ↔ web
✅ **Mode hors ligne** avec cache local  
✅ **Indicateur de connexion** visuel
✅ **Notifications** de synchronisation
✅ **Sauvegarde automatique** de toutes les modifications
✅ **Récupération automatique** en cas de perte de connexion

## 🆘 Dépannage

**Erreur "Firebase not initialized" :**
- Vérifier que la configuration est correcte
- Vérifier que les règles Firestore permettent l'accès

**Pas de synchronisation :**
- Vérifier la connexion internet
- Ouvrir la console pour voir les erreurs
- Vérifier que les deux appareils utilisent la même configuration

**Données perdues :**
- Les données sont sauvegardées localement ET sur Firebase
- En cas de problème, les données locales sont conservées

## 💰 Limites gratuites Firebase

- **50,000 lectures/jour** (largement suffisant)
- **20,000 écritures/jour** (largement suffisant)  
- **1 GB stockage** (vos données = quelques KB)
- **10 GB bande passante/mois**

Votre usage GR10 restera dans les limites gratuites.
