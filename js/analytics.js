// Gestionnaire pour la section Analytics & Performance
class Analytics {
    constructor() {
        this.loadAnalytics();
    }


    loadAnalytics() {
        this.calculatePerformanceStats();
        this.generateProgressChart();
        this.generateComparisonChart();
        this.calculateWeatherStats();
    }

    calculatePerformanceStats() {
        const completedStages = window.progressManager?.getCompletedStages() || [];
        const totalStages = window.itineraryData?.length || 48;
        
        // Rythme moyen (étapes par semaine)
        const startDate = new Date('2025-09-08');
        const currentDate = new Date();
        const daysPassed = Math.max(1, Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)));
        const averagePace = completedStages.length > 0 ? 
            (completedStages.length / daysPassed * 7).toFixed(1) : '0';

        // Temps estimé restant
        const remainingStages = totalStages - completedStages.length;
        const estimatedDays = averagePace > 0 ? Math.ceil(remainingStages / (averagePace / 7)) : '-';
        const estimatedRemaining = estimatedDays !== '-' ? `${estimatedDays} jours` : 'Calcul impossible';

        // Étapes difficiles à venir
        const difficultStages = this.getDifficultStagesAhead(completedStages);

        // Mettre à jour l'interface
        const averagePaceEl = document.getElementById('average-pace');
        const estimatedRemainingEl = document.getElementById('estimated-remaining');
        const difficultStagesEl = document.getElementById('difficult-stages');

        if (averagePaceEl) averagePaceEl.textContent = `${averagePace} étapes/semaine`;
        if (estimatedRemainingEl) estimatedRemainingEl.textContent = estimatedRemaining;
        if (difficultStagesEl) difficultStagesEl.textContent = difficultStages;
    }

    getDifficultStagesAhead(completedStages) {
        if (!window.itineraryData) return '0';

        const upcomingStages = window.itineraryData.filter(stage => 
            !completedStages.includes(stage.day) && 
            stage.difficulty && 
            stage.difficulty.toLowerCase() === 'difficile'
        );

        return upcomingStages.length.toString();
    }

    generateProgressChart() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const completedStages = window.progressManager?.getCompletedStages() || [];
        
        // Simuler la progression par semaine
        const weeks = this.getWeeklyProgress(completedStages);
        
        this.drawChart(ctx, {
            labels: weeks.map((_, i) => `S${i + 1}`),
            data: weeks,
            color: '#3b82f6',
            title: 'Étapes complétées par semaine'
        });
    }

    generateComparisonChart() {
        const canvas = document.getElementById('comparison-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const completedStages = window.progressManager?.getCompletedStages() || [];
        
        // Données simulées pour la comparaison
        const actualData = this.getActualVsEstimated(completedStages);
        
        this.drawComparisonChart(ctx, actualData);
    }

    getWeeklyProgress(completedStages) {
        const startDate = new Date('2025-09-08');
        const currentDate = new Date();
        const weeksPassed = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        
        const weeks = [];
        for (let i = 0; i < Math.max(weeksPassed, 1); i++) {
            // Simuler la progression (en réalité, il faudrait tracker les dates de completion)
            const stagesThisWeek = Math.floor(completedStages.length / Math.max(weeksPassed, 1));
            weeks.push(stagesThisWeek + Math.random() * 2);
        }
        
        return weeks;
    }

    getActualVsEstimated(completedStages) {
        const totalStages = window.itineraryData?.length || 48;
        const daysPassed = Math.max(1, Math.floor((new Date() - new Date('2025-09-08')) / (1000 * 60 * 60 * 24)));
        
        return {
            actual: completedStages.length,
            estimated: Math.floor((daysPassed / 48) * totalStages),
            total: totalStages
        };
    }

    drawChart(ctx, config) {
        const { labels, data, color, title } = config;
        const canvas = ctx.canvas;
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fond
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (data.length === 0) return;

        const maxValue = Math.max(...data) || 1;
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        // Dessiner les barres
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + barSpacing);
            const y = padding + chartHeight - barHeight;

            // Barre
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Label
            ctx.fillStyle = isDark ? '#cbd5e1' : '#64748b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth / 2, canvas.height - 10);

            // Valeur
            ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
            ctx.fillText(Math.round(value), x + barWidth / 2, y - 5);
        });
    }

    drawComparisonChart(ctx, data) {
        const canvas = ctx.canvas;
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fond
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = chartWidth / 3;
        const categories = [
            { label: 'Réalisé', value: data.actual, color: '#10b981' },
            { label: 'Estimé', value: data.estimated, color: '#f59e0b' },
            { label: 'Total', value: data.total, color: '#e5e7eb' }
        ];

        const maxValue = data.total;

        categories.forEach((cat, index) => {
            const barHeight = (cat.value / maxValue) * chartHeight;
            const x = padding + index * barWidth;
            const y = padding + chartHeight - barHeight;

            // Barre
            ctx.fillStyle = cat.color;
            ctx.fillRect(x + 10, y, barWidth - 20, barHeight);

            // Label
            ctx.fillStyle = isDark ? '#cbd5e1' : '#64748b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(cat.label, x + barWidth / 2, canvas.height - 10);

            // Valeur
            ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
            ctx.fillText(cat.value, x + barWidth / 2, y - 5);
        });
    }

    calculateWeatherStats() {
        // Simuler des données météo basées sur les étapes complétées
        const completedStages = window.progressManager?.getCompletedStages() || [];
        
        // En réalité, ces données viendraient d'une API météo ou des notes utilisateur
        const sunnyDays = Math.floor(completedStages.length * 0.6);
        const rainyDays = Math.floor(completedStages.length * 0.25);
        const windyDays = Math.floor(completedStages.length * 0.15);

        const sunnyEl = document.getElementById('sunny-days');
        const rainyEl = document.getElementById('rainy-days');
        const windyEl = document.getElementById('windy-days');

        if (sunnyEl) sunnyEl.textContent = sunnyDays;
        if (rainyEl) rainyEl.textContent = rainyDays;
        if (windyEl) windyEl.textContent = windyDays;
    }
}

// Initialiser les analytics
document.addEventListener('DOMContentLoaded', () => {
    window.analytics = new Analytics();
});
