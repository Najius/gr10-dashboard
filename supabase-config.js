// Configuration Supabase pour GR10 Dashboard
// Alternative à Firebase - Plus simple et gratuit

// Import Supabase client depuis CDN officiel - Version compatible
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Alternative: Charger Supabase via script global
const { createClient } = window.supabase || (() => {
    console.warn('⚠️ Supabase non disponible, mode fallback activé');
    return { createClient: () => null };
})();

// Configuration Supabase - Clés du projet GR10
const supabaseUrl = 'https://nuspizxrmuoosobkllvo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51c3BpenhybXVvb3NvYmtsbHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjk4NDksImV4cCI6MjA3Mjc0NTg0OX0.HZGDnlspgnL0zP1yklqpnriCNqSwjjXIwojwKY_0Wlw'

// Initialiser Supabase avec vérification
const supabase = createClient ? createClient(supabaseUrl, supabaseKey) : null

// Classe de gestion Supabase
class SupabaseSync {
    constructor() {
        this.supabase = supabase; // Référence vers l'instance Supabase globale
        this.isOnline = false;
        this.testConnection();
    }

    async testConnection() {
        try {
            if (!this.supabase) {
                throw new Error('Client Supabase non initialisé');
            }
            
            // Test de connexion avec la table gr10_progress existante
            const { data, error } = await this.supabase.from('gr10_progress').select('*').limit(1);
            if (error && error.code !== 'PGRST116') { // PGRST116 = aucune donnée (OK)
                throw error;
            }
            this.isOnline = true;
            console.log('✅ Supabase connecté et opérationnel');
        } catch (error) {
            this.isOnline = false;
            console.error('❌ Supabase connexion échouée:', error.message);
            console.warn('⚠️ Mode hors ligne activé - utilisation localStorage uniquement');
        }
    }

    // Méthode pour sauvegarder le progrès d'une étape
    async saveProgress(stageId, data) {
        if (!this.isOnline || !this.supabase) {
            console.warn(`⚠️ Supabase hors ligne - sauvegarde étape ${stageId} ignorée`);
            return false;
        }
        
        try {
            console.log(`💾 Sauvegarde étape ${stageId}:`, data);
            
            // Forcer la création d'un nouvel enregistrement ou mise à jour complète
            const saveData = {
                stage_id: stageId,
                user_id: 'default_user',
                completed: data.completed || false,
                notes: data.notes || null,
                photos: data.photos || [],
                comments: data.comments || [],
                rating: data.rating || null,
                detailed_rating: data.detailedRating || null,
                featured_photo: data.featuredPhoto || null,
                time: data.time || null,
                updated_at: new Date().toISOString()
            };
            
            // D'abord supprimer l'enregistrement existant s'il y en a un
            await this.supabase
                .from('gr10_progress')
                .delete()
                .eq('stage_id', stageId)
                .eq('user_id', 'default_user');
            
            // Puis insérer le nouvel enregistrement
            const { error } = await this.supabase
                .from('gr10_progress')
                .insert(saveData);

            if (error) {
                console.error('❌ Erreur sauvegarde Supabase:', error);
                return false;
            }
            
            console.log(`✅ Étape ${stageId} sauvegardée avec succès (force refresh)`);
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            return false;
        }
    }

    // MÉTHODE SUPPRIMÉE - utiliser saveProgress() individuellement
    // Cette méthode causait l'erreur "operator_gt" avec Supabase

    // Méthode pour récupérer le progrès d'une étape
    async getProgress(stageId) {
        if (!this.isOnline || !this.supabase) {
            console.warn(`⚠️ Supabase hors ligne - récupération étape ${stageId} ignorée`);
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('gr10_progress')
                .select('*')
                .eq('stage_id', stageId)
                .eq('user_id', 'default_user')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error(`❌ Erreur récupération étape ${stageId}:`, error);
                return null;
            }

            return data ? {
                completed: data.completed,
                notes: data.notes,
                photos: data.photos || [],
                comments: data.comments || [],
                rating: data.rating,
                detailedRating: data.detailed_rating,
                featuredPhoto: data.featured_photo,
                time: data.time
            } : null;
        } catch (error) {
            console.error(`❌ Erreur getProgress étape ${stageId}:`, error);
            return null;
        }
    }

    // Écouter les changements en temps réel
    listenToProgress(stageId, callback) {
        if (!this.isOnline || !this.supabase) return;

        return this.supabase
            .channel(`progress-${stageId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'gr10_progress',
                filter: `stage_id=eq.${stageId}`
            }, callback)
            .subscribe();
    }

    // Écouter tous les changements
    listenToAllProgress(callback) {
        if (!this.isOnline) return;

        return supabase
            .channel('all-progress')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'gr10_progress'
            }, (payload) => {
                // Transformer les données pour compatibilité
                const allData = {};
                if (payload.new) {
                    allData[payload.new.stage_id] = {
                        completed: payload.new.completed,
                        completedAt: payload.new.completed_at,
                        notes: payload.new.notes,
                        rating: payload.new.rating,
                        photos: payload.new.photos,
                        featuredPhoto: payload.new.featured_photo,
                        comments: payload.new.comments,
                        detailedRating: payload.new.detailed_rating,
                        time: payload.new.time,
                        timestamp: payload.new.timestamp
                    };
                }
                callback(allData);
            })
            .subscribe();
    }
}

// Export pour utilisation
window.SupabaseSync = SupabaseSync;
console.log('🔥 Supabase configuré pour GR10 Dashboard');
