// Configuration Supabase pour GR10 Dashboard
// Alternative à Firebase - Plus simple et gratuit

// Import Supabase client depuis CDN officiel
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Configuration Supabase - Clés du projet GR10
const supabaseUrl = 'https://nuspizxrmuoosobkllvo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51c3BpenhybXVvb3NvYmtsbHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjk4NDksImV4cCI6MjA3Mjc0NTg0OX0.HZGDnlspgnL0zP1yklqpnriCNqSwjjXIwojwKY_0Wlw'

// Initialiser Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

// Classe de gestion Supabase
class SupabaseSync {
    constructor() {
        this.isOnline = false;
        this.testConnection();
    }

    async testConnection() {
        try {
            // Test de connexion avec la table gr10_progress existante
            const { data, error } = await supabase.from('gr10_progress').select('*').limit(1);
            if (error && error.code !== 'PGRST116') { // PGRST116 = aucune donnée (OK)
                throw error;
            }
            this.isOnline = true;
            console.log('✅ Supabase connecté et opérationnel');
        } catch (error) {
            this.isOnline = false;
            console.error('❌ Supabase connexion échouée:', error.message);
            console.warn('⚠️ Mode hors ligne activé');
        }
    }

    // Méthode pour sauvegarder le progrès d'une étape
    async saveProgress(stageId, data) {
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

    // Sauvegarder toutes les données utilisateur d'un coup
    async saveAllUserData(allData) {
        if (!this.isOnline) return false;

        try {
            const records = Object.entries(allData).map(([stageId, stageData]) => ({
                stage_id: stageId.toString(),
                user_id: 'anonymous',
                completed: stageData.completed || false,
                completed_at: stageData.completedAt,
                notes: stageData.notes || '',
                rating: stageData.rating,
                photos: stageData.photos || [],
                featured_photo: stageData.featuredPhoto,
                comments: stageData.comments || [],
                detailed_rating: stageData.detailedRating || {},
                time: stageData.time,
                timestamp: Date.now(),
                last_updated: new Date().toISOString()
            }));

            const { data, error } = await supabase
                .from('gr10_progress')
                .upsert(records, {
                    onConflict: 'stage_id,user_id'
                });

            if (error) throw error;
            console.log('📤 Toutes les données sauvegardées dans Supabase');
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde batch Supabase:', error);
            console.error('Détails de l\'erreur:', error.message, error.code);
            return false;
        }
    }

    // Récupérer le progrès d'une étape
    async getProgress(stageId) {
        if (!this.isOnline) return null;

        try {
            const { data, error } = await supabase
                .from('gr10_progress')
                .select('*')
                .eq('stage_id', stageId.toString())
                .eq('user_id', 'anonymous')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Erreur récupération Supabase:', error);
            return null;
        }
    }

    // Écouter les changements en temps réel
    listenToProgress(stageId, callback) {
        if (!this.isOnline) return;

        return supabase
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
