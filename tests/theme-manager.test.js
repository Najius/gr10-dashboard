/**
 * Tests pour ThemeManager
 */
describe('ThemeManager', () => {
    let themeManager;
    let mockStorageManager;

    beforeEach(() => {
        // Mock du StorageManager
        mockStorageManager = {
            getTheme: () => 'light',
            setTheme: (theme) => true
        };
        window.storageManager = mockStorageManager;
        
        // Nettoyer les attributs de thème
        document.documentElement.removeAttribute('data-theme');
        
        themeManager = new ThemeManager();
    });

    afterEach(() => {
        // Nettoyer
        delete window.storageManager;
    });

    it('should initialize with light theme by default', () => {
        expect(themeManager.currentTheme).toBe('light');
        expect(themeManager.toggleButtons).toEqual([]);
    });

    it('should toggle between light and dark themes', () => {
        expect(themeManager.currentTheme).toBe('light');
        
        themeManager.toggleTheme();
        expect(themeManager.currentTheme).toBe('dark');
        
        themeManager.toggleTheme();
        expect(themeManager.currentTheme).toBe('light');
    });

    it('should set theme correctly', () => {
        themeManager.setTheme('dark');
        expect(themeManager.currentTheme).toBe('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should reject invalid themes', () => {
        const originalTheme = themeManager.currentTheme;
        themeManager.setTheme('invalid');
        expect(themeManager.currentTheme).toBe(originalTheme);
    });

    it('should apply theme to document', () => {
        themeManager.applyTheme('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        
        themeManager.applyTheme('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should detect system preference', () => {
        // Mock matchMedia
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = (query) => ({
            matches: query.includes('dark'),
            addEventListener: () => {},
            removeEventListener: () => {}
        });
        
        expect(themeManager.getSystemPreference()).toBe('dark');
        
        window.matchMedia = (query) => ({
            matches: false,
            addEventListener: () => {},
            removeEventListener: () => {}
        });
        
        expect(themeManager.getSystemPreference()).toBe('light');
        
        // Restaurer
        window.matchMedia = originalMatchMedia;
    });

    it('should check if dark mode is active', () => {
        themeManager.currentTheme = 'light';
        expect(themeManager.isDarkMode()).toBeFalsy();
        
        themeManager.currentTheme = 'dark';
        expect(themeManager.isDarkMode()).toBeTruthy();
    });

    it('should return current theme', () => {
        themeManager.currentTheme = 'dark';
        expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should reset to light theme', () => {
        themeManager.currentTheme = 'dark';
        themeManager.reset();
        expect(themeManager.currentTheme).toBe('light');
    });

    it('should add and remove toggle buttons', () => {
        const button1 = document.createElement('button');
        const button2 = document.createElement('button');
        
        themeManager.addToggleButton(button1);
        expect(themeManager.toggleButtons).toContain(button1);
        
        themeManager.addToggleButton(button2);
        expect(themeManager.toggleButtons).toHaveLength(2);
        
        // Ne pas ajouter le même bouton deux fois
        themeManager.addToggleButton(button1);
        expect(themeManager.toggleButtons).toHaveLength(2);
        
        themeManager.removeToggleButton(button1);
        expect(themeManager.toggleButtons).not.toContain(button1);
        expect(themeManager.toggleButtons).toHaveLength(1);
    });

    it('should update toggle icons correctly', () => {
        const button = document.createElement('button');
        const icon = document.createElement('i');
        button.appendChild(icon);
        
        themeManager.addToggleButton(button);
        
        // Mode clair -> icône lune
        themeManager.currentTheme = 'light';
        themeManager.updateToggleIcons();
        expect(icon.className).toBe('fas fa-moon');
        
        // Mode sombre -> icône soleil
        themeManager.currentTheme = 'dark';
        themeManager.updateToggleIcons();
        expect(icon.className).toBe('fas fa-sun');
    });

    it('should dispatch theme change events', () => {
        let eventFired = false;
        let eventDetail = null;
        
        window.addEventListener('themeChanged', (e) => {
            eventFired = true;
            eventDetail = e.detail;
        });
        
        themeManager.setTheme('dark');
        
        expect(eventFired).toBeTruthy();
        expect(eventDetail.theme).toBe('dark');
    });
});
