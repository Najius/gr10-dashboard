// Configuration Supabase pour GR10 Dashboard
// Alternative à Firebase - Plus simple et gratuit

// Import Supabase client depuis CDN officiel - Version compatible
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Configuration Supabase - Clés du projet GR10 (corrigées)
const supabaseUrl = 'https://nuspizxrmuoosobkllvo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51c3BpenhybXVvb3NvYmtsbHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjk4NDksImV4cCI6MjA3Mjc0NTg0OX0.HZGDnlspgnL0zP1yklqpnriCNqSwjjXIwojwKY_0Wlw'

// Attendre que Supabase soit chargé depuis le CDN
let supabase = null;

// Fonction d'initialisation différée
function initSupabase() {
    console.log('🔍 Tentative d\'initialisation Supabase...');
    console.log('🔍 window.supabase disponible:', !!window.supabase);
    console.log('🔍 window.supabase.createClient disponible:', !!(window.supabase && window.supabase.createClient));
    
    if (window.supabase && window.supabase.createClient) {
        try {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
            console.log('✅ Client Supabase initialisé avec succès');
            console.log('🔍 URL Supabase:', supabaseUrl);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
            return false;
        }
    }
    console.warn('⚠️ Supabase CDN non encore chargé');
    console.log('🔍 Environnement:', {
        userAgent: navigator.userAgent,
        location: window.location.href,
        protocol: window.location.protocol
    });
    return false;
}

// Initialiser immédiatement si Supabase est déjà disponible
if (window.supabase) {
    initSupabase();
}

// Classe de gestion Supabase
class SupabaseSync {
    constructor() {
        // Initialiser Supabase si pas encore fait
        if (!supabase) {
            initSupabase();
        }
        this.supabase = supabase;
        this.isOnline = false;
        // Tester la connexion de manière asynchrone
        this.initializeConnection();
    }

    async initializeConnection() {
        // Forcer un timeout global pour éviter les blocages
        const globalTimeout = setTimeout(() => {
            if (!this.isOnline) {
                console.log('🚨 Timeout global - forcer mode hors ligne');
                this.isOnline = false;
            }
        }, 8000);
        
        try {
            await this.testConnection();
        } finally {
            clearTimeout(globalTimeout);
        }
    }

    async testConnection() {
        console.log('🔍 Test de connexion Supabase simplifié...');
        
        try {
            if (!this.supabase) {
                throw new Error('Client Supabase non initialisé');
            }
            
            // Test simplifié avec timeout court
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const { data, error } = await this.supabase
                .from('gr10_progress')
                .select('stage_id')
                .limit(1)
                .abortSignal(controller.signal);
            
            clearTimeout(timeoutId);
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            this.isOnline = true;
            console.log('✅ Supabase connecté - synchronisation mobile activée');
            
        } catch (error) {
            this.isOnline = false;
            console.log('⚠️ Supabase hors ligne, mode localStorage uniquement');
            console.log('🔍 Erreur:', error.message);
        }
        
        /* Code original commenté pour debug
        try {
            console.log('🔍 Test de connexion Supabase...');
            console.log('🔍 Client Supabase:', !!this.supabase);
            
            if (!this.supabase) {
                throw new Error('Client Supabase non initialisé');
            }
            
            // Test de connexion avec timeout pour éviter les blocages
            console.log('🔍 Tentative de requête vers gr10_progress avec timeout...');
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    console.log('⏰ Timeout déclenché après 5 secondes');
                    reject(new Error('Timeout de connexion Supabase (5s)'));
                }, 5000);
            });
            
            const requestPromise = this.supabase.from('gr10_progress').select('*').limit(1);
            
            console.log('🔍 Démarrage Promise.race...');
            const result = await Promise.race([requestPromise, timeoutPromise]);
            console.log('🔍 Promise.race terminée:', result);
            
            const { data, error } = result;
            console.log('🔍 Réponse Supabase:', { data, error });
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = aucune donnée (OK)
                throw error;
            }
            this.isOnline = true;
            console.log('✅ Supabase connecté et opérationnel');
            console.log('🔍 Données existantes:', data?.length || 0, 'enregistrements');
            console.log('🔍 Status isOnline mis à jour:', this.isOnline);
        } catch (error) {
            this.isOnline = false;
            console.error('❌ Supabase connexion échouée:', error.message);
            console.error('❌ Détails de l\'erreur:', error);
            console.warn('⚠️ Mode hors ligne activé - utilisation localStorage uniquement');
            console.log('🔍 Status isOnline mis à jour:', this.isOnline);
        }
        */
    }

    // Méthode pour sauvegarder le progrès d'une étape
    async saveProgress(stageId, data) {
        if (!this.isOnline || !this.supabase) {
            console.warn(`⚠️ Supabase hors ligne - sauvegarde étape ${stageId} ignorée`);
            return false;
        }
        
        try {
            console.log(`💾 Sauvegarde étape ${stageId}:`, data);
            
            // Utiliser upsert avec .select() comme conseillé par ChatGPT
            const saveData = {
                stage_id: stageId.toString(), // Forcer en string pour éviter operator_gt
                user_id: 'anonymous',
                completed: data.completed || false,
                completed_at: data.completed ? new Date().toISOString() : null,
                notes: data.notes || '',
                rating: data.rating || null,
                photos: data.photos || [],
                featured_photo: data.featuredPhoto || null,
                comments: data.comments || [],
                detailed_rating: data.detailedRating || {},
                time: data.time || null,
                timestamp: Date.now(),
                last_updated: new Date().toISOString()
            };
            
            // Utiliser upsert avec .select() pour récupérer les données après insertion
            const { data: result, error } = await this.supabase
                .from('gr10_progress')
                .upsert(saveData, { 
                    onConflict: 'stage_id,user_id',
                    ignoreDuplicates: false 
                })
                .select();

            if (error) {
                console.error('❌ Erreur sauvegarde Supabase:', error);
                return false;
            }
            
            console.log(`✅ Étape ${stageId} sauvegardée avec succès:`, result);
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            return false;
        }
    }

    // Méthode de sauvegarde batch simplifiée (sans upsert problématique)
    async saveAllUserData(allData) {
        console.log('⚠️ saveAllUserData appelée - redirection vers sauvegarde individuelle');
        
        // Au lieu d'utiliser upsert (qui cause operator_gt), sauvegarder individuellement
        let successCount = 0;
        for (const [stageId, stageData] of Object.entries(allData)) {
            const success = await this.saveProgress(parseInt(stageId), stageData);
            if (success) successCount++;
        }
        
        console.log(`📤 ${successCount}/${Object.keys(allData).length} étapes sauvegardées individuellement`);
        return successCount > 0;
    }

    // Méthode pour récupérer le progrès d'une étape
    async getProgress(stageId) {
        if (!this.isOnline || !this.supabase) {
            console.warn(`⚠️ Supabase hors ligne - récupération étape ${stageId} ignorée`);
            return null;
        }

        try {
            console.log(`🔍 Requête Supabase pour étape ${stageId} (string: "${stageId.toString()}")`);
            
            const { data, error } = await this.supabase
                .from('gr10_progress')
                .select('*')
                .eq('stage_id', stageId.toString())
                .eq('user_id', 'anonymous')
                .limit(1);

            console.log(`🔍 Réponse Supabase pour étape ${stageId}:`, { data, error });

            if (error) {
                console.error(`❌ Erreur récupération étape ${stageId}:`, error);
                return null;
            }

            if (data && data.length > 0) {
                const record = data[0]; // Prendre le premier enregistrement
                console.log(`📥 Données trouvées pour étape ${stageId}:`, record);
                return {
                    completed: record.completed,
                    notes: record.notes,
                    photos: record.photos || [],
                    comments: record.comments || [],
                    rating: record.rating,
                    detailedRating: record.detailed_rating,
                    featuredPhoto: record.featured_photo,
                    time: record.time
                };
            } else {
                console.log(`📭 Aucune donnée pour étape ${stageId}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Erreur getProgress étape ${stageId}:`, error);
            return null;
        }
    }

    // Méthode pour récupérer toutes les étapes (compatibilité avec loadGR10Data)
    async getStages() {
        console.log('⚠️ getStages() appelée - cette méthode ne charge pas les étapes depuis Supabase');
        console.log('⚠️ Les étapes GR10 sont chargées depuis gr10Data ou le cache local');
        return null; // Forcer l'utilisation du fallback
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
                filter: `stage_id=eq.${JSON.stringify(stageId.toString())}`
            }, callback)
            .subscribe();
    }

    // Écouter tous les changements
    listenToAllProgress(callback) {
        if (!this.isOnline) return;

        return this.supabase
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
