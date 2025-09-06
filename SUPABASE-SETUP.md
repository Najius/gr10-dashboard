# 🚀 Configuration Supabase pour GR10 Dashboard

## Pourquoi Supabase plutôt que Firebase ?

✅ **Avantages de Supabase :**
- **Gratuit jusqu'à 500MB** (vs Firebase 1GB mais plus complexe)
- **PostgreSQL** (plus puissant que Firestore)
- **API REST automatique** 
- **Temps réel intégré**
- **Interface admin claire**
- **Pas de configuration complexe**

## 🎯 Setup rapide (5 minutes)

### 1. Créer un projet Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. "Start your project" → Sign up avec GitHub
3. "New project" → nom: `gr10-dashboard`
4. Choisir région `West Europe (Ireland)`
5. Mot de passe base de données (noter quelque part)

### 2. Créer la table de données
Dans l'onglet "SQL Editor", exécuter :

```sql
-- Créer la table pour les données GR10
CREATE TABLE gr10_progress (
    id BIGSERIAL PRIMARY KEY,
    stage_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'anonymous',
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    rating INTEGER,
    photos JSONB DEFAULT '[]',
    featured_photo TEXT,
    comments JSONB DEFAULT '[]',
    detailed_rating JSONB DEFAULT '{}',
    time TEXT,
    timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stage_id, user_id)
);

-- Index pour les performances
CREATE INDEX idx_gr10_progress_stage_user ON gr10_progress(stage_id, user_id);

-- Activer Row Level Security (sécurité)
ALTER TABLE gr10_progress ENABLE ROW LEVEL SECURITY;

-- Politique permissive pour développement
CREATE POLICY "Allow all operations" ON gr10_progress FOR ALL USING (true);
```

### 3. Obtenir les clés API
1. Onglet "Settings" → "API"
2. Copier :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : `eyJhbGc...`

### 4. Configurer le dashboard
Dans `supabase-config.js`, remplacer :

```javascript
const supabaseUrl = 'https://VOTRE_PROJECT_ID.supabase.co'
const supabaseKey = 'VOTRE_ANON_KEY'
```

### 5. Intégrer dans index.html
Ajouter avant la fermeture `</body>` :

```html
<!-- Supabase Integration -->
<script type="module" src="supabase-config.js"></script>
<script>
// Remplacer Firebase par Supabase
document.addEventListener('DOMContentLoaded', async () => {
    if (window.SupabaseSync) {
        window.dashboard.firebaseSync = new window.SupabaseSync();
        console.log('🔄 Supabase activé pour synchronisation');
    }
});
</script>
```

## 🧪 Test de fonctionnement

Après configuration :
1. Recharger la page
2. Console devrait afficher : `✅ Supabase connecté et opérationnel`
3. Mode admin → modifier une étape
4. Vérifier dans Supabase Dashboard → Table Editor → `gr10_progress`

## 📊 Avantages vs Firebase

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Setup | 5 min | 15+ min |
| Gratuit | 500MB + 2GB bandwidth | 1GB mais quotas stricts |
| Base de données | PostgreSQL (SQL) | NoSQL (plus limité) |
| Temps réel | Natif | Configuration complexe |
| Interface admin | Claire et intuitive | Complexe |
| Debugging | Logs SQL clairs | Erreurs cryptiques |

## 🔒 Sécurité production

Pour la production, remplacer la politique par :

```sql
-- Supprimer la politique permissive
DROP POLICY "Allow all operations" ON gr10_progress;

-- Politique sécurisée (authentification requise)
CREATE POLICY "Authenticated users only" ON gr10_progress 
FOR ALL USING (auth.uid()::text = user_id);
```

## 🚀 Migration depuis Firebase

Le code est compatible ! Supabase utilise la même interface que Firebase dans le dashboard. Changement transparent.
