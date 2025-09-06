# 🔥 Configuration Firebase pour GR10 Dashboard

## ⚠️ PROBLÈME ACTUEL
La configuration Firebase actuelle utilise des clés invalides, causant l'erreur "Échec synchronisation Firebase".

## Solution rapide

### 1. Créer un nouveau projet Firebase
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur "Ajouter un projet"
3. Nommer le projet (ex: "gr10-dashboard-prod")
4. Désactiver Google Analytics (optionnel)

### 2. Configurer Firestore Database
1. Dans le projet Firebase, aller dans "Firestore Database"
2. Cliquer sur "Créer une base de données"
3. Choisir "Commencer en mode test" pour les règles
4. Sélectionner une région (europe-west1 recommandé)

### 3. Obtenir la configuration
1. Aller dans "Paramètres du projet" (icône engrenage)
2. Dans l'onglet "Général", section "Vos applications"
3. Cliquer sur l'icône web "</>"
4. Enregistrer l'application (nom: "GR10 Dashboard")
5. Copier l'objet `firebaseConfig`

### 4. Mettre à jour firebase-config-clean.js
Remplacer les lignes 10-15 dans `firebase-config-clean.js`:

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_VRAIE_API_KEY",
    authDomain: "VOTRE_PROJET.firebaseapp.com", 
    projectId: "VOTRE_PROJET_ID",
    storageBucket: "VOTRE_PROJET.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

### 5. Configurer les règles Firestore (IMPORTANT)
Dans Firestore Database > Règles, remplacer par:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre lecture/écriture pour tous (développement)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Test de la configuration

Après configuration, recharger la page et vérifier dans la console:
- ✅ `Firebase connecté et opérationnel`
- ✅ `Synchronisation admin Firebase réussie`

## Structure des données Firestore

Collections utilisées:
- `gr10-progress`: Progression des étapes (photos, validations, notes)
- `test`: Collection de test pour vérifier la connexion

## Sécurité en production

Pour la production, restreindre les règles Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gr10-progress/{document} {
      allow read, write: if request.auth != null;
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
