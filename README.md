# 🏔️ GR10 Dashboard

Dashboard interactif pour le suivi du parcours GR10 (Sentier de Grande Randonnée des Pyrénées).

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.6+ ou Node.js 14+
- Navigateur web moderne

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd gr10-dashboard

# Démarrer le serveur local
python3 start-server.py
# ou
node simple-server.js

# Ouvrir http://localhost:8080 dans votre navigateur
```

## 🏗️ Architecture

### Structure du Projet
```
gr10-dashboard/
├── src/                    # Code source modulaire
│   ├── core/              # Modules principaux
│   │   ├── app.js         # Application principale
│   │   ├── dashboard.js   # Logique dashboard
│   │   └── data-manager.js # Gestionnaire de données
│   ├── components/        # Composants réutilisables
│   │   ├── stage-card.js  # Cartes d'étapes
│   │   └── theme-manager.js # Gestion des thèmes
│   └── utils/             # Utilitaires
│       ├── error-handler.js # Gestion d'erreurs
│       └── storage-manager.js # Stockage local
├── css/                   # Feuilles de style
├── js/                    # Scripts legacy
├── tests/                 # Tests unitaires
├── backups/              # Fichiers de sauvegarde
└── index.html            # Point d'entrée
```

### Modules Principaux

#### 🎯 **GR10Application** (`src/core/app.js`)
Point d'entrée unifié de l'application.
- Détection automatique du mode (admin/public)
- Initialisation des modules
- Coordination des composants

#### 📊 **DataManager** (`src/core/data-manager.js`)
Gestionnaire centralisé des données d'étapes.
- Chargement des données depuis multiples sources
- API uniforme d'accès aux données
- Calcul de statistiques globales

#### 🎨 **ThemeManager** (`src/components/theme-manager.js`)
Gestion des thèmes clair/sombre.
- Basculement automatique
- Préférence système
- Persistance des paramètres

#### 💾 **StorageManager** (`src/utils/storage-manager.js`)
Stockage local robuste avec fallbacks.
- Gestion localStorage avec cache mémoire
- API simplifiée pour les données GR10
- Export/import des données

#### 🚨 **ErrorHandler** (`src/utils/error-handler.js`)
Gestion centralisée des erreurs.
- Capture automatique des erreurs
- Notifications utilisateur
- Logging et métriques

## 🎮 Fonctionnalités

### Mode Public
- ✅ Visualisation des étapes
- ✅ Suivi de progression
- ✅ Météo en temps réel
- ✅ Analytics et statistiques

### Mode Admin
- ✅ Validation des étapes
- ✅ Ajout de notes et photos
- ✅ Évaluations détaillées
- ✅ Gestion des données

## 🧪 Tests

```bash
# Ouvrir la suite de tests
open tests/test-runner.html

# Ou via serveur local
http://localhost:8080/tests/test-runner.html
```

### Couverture de Tests
- ✅ StorageManager (gestion des données)
- ✅ ErrorHandler (gestion d'erreurs)
- ✅ DataManager (chargement des données)
- ✅ ThemeManager (gestion des thèmes)

## 🔧 Développement

### Serveurs de Développement

**Option 1: Python (Recommandé)**
```bash
python3 start-server.py
# Port: 8080, CORS activé, cache désactivé
```

**Option 2: Node.js**
```bash
node simple-server.js
# Port: 8000, support MIME complet
```

### Workflow de Développement
1. Modifier les fichiers source
2. Actualiser le navigateur
3. Tester les changements
4. Lancer les tests unitaires

### Ajout de Nouvelles Fonctionnalités

#### 1. Créer un Nouveau Module
```javascript
// src/features/mon-module.js
class MonModule {
    constructor() {
        this.init();
    }
    
    init() {
        // Initialisation
    }
}

window.monModule = new MonModule();
```

#### 2. Intégrer dans l'Application
```javascript
// src/core/app.js
async initComponents() {
    // Ajouter votre module
    this.modules.monModule = window.monModule;
}
```

#### 3. Ajouter des Tests
```javascript
// tests/mon-module.test.js
describe('MonModule', () => {
    it('should work correctly', () => {
        expect(window.monModule).toBeTruthy();
    });
});
```

## 📝 API

### StorageManager
```javascript
// Étapes complétées
storageManager.completeStage(1);
storageManager.isStageCompleted(1); // true

// Notes d'étapes
storageManager.setStageNotes(1, 'Belle vue !');
storageManager.getStageNotes(1); // 'Belle vue !'

// Statistiques
storageManager.getProgressStats();
// { completed: 3, remaining: 45, percentage: 6 }
```

### ErrorHandler
```javascript
// Logger des erreurs
window.logError('Message d\'erreur', { context: 'data' });
window.logWarning('Avertissement');
window.logInfo('Information');

// Récupérer les erreurs récentes
window.errorHandler.getRecentErrors(5);
```

### DataManager
```javascript
// Charger les données
await window.dataManager.loadStages();

// Accéder aux étapes
const stages = window.dataManager.getAllStages();
const stage1 = window.dataManager.getStageByDay(1);

// Statistiques globales
const stats = window.dataManager.getGlobalStats();
```

## 🎨 Thèmes

### Variables CSS Personnalisables
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #10b981;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
}
```

### Basculement de Thème
```javascript
// Programmatique
window.themeManager.setTheme('dark');
window.themeManager.toggleTheme();

// Via événement
window.addEventListener('themeChanged', (e) => {
    console.log('Nouveau thème:', e.detail.theme);
});
```

## 🚀 Déploiement

### Netlify (Configuré)
```bash
# Le fichier netlify.toml est déjà configuré
# Push vers votre repository Git connecté à Netlify
```

### Serveur Web Statique
```bash
# Copier tous les fichiers vers votre serveur web
# Assurer que index.html est le point d'entrée
```

## 🐛 Debugging

### Console de Debug
```javascript
// Statistiques de l'application
window.gr10App.getStats();

// Log d'erreurs
window.errorHandler.getRecentErrors();

// Export des données
window.storageManager.exportData();
```

### Outils de Développement
- Console du navigateur pour les logs
- Network tab pour les requêtes
- Application tab pour localStorage
- Tests unitaires pour la validation

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/ma-feature`)
3. Commiter les changements (`git commit -am 'Ajout de ma feature'`)
4. Pousser vers la branche (`git push origin feature/ma-feature`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Issues**: Ouvrir une issue sur GitHub
- **Documentation**: Ce README et les commentaires dans le code
- **Tests**: Suite de tests dans `/tests/`

---

*Dernière mise à jour: 29 août 2025*
