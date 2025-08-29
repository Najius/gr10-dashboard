/**
 * Tests pour ErrorHandler
 */
describe('ErrorHandler', () => {
    let errorHandler;
    let originalConsoleError;
    let consoleMessages;

    beforeEach(() => {
        // Capturer les messages console
        consoleMessages = [];
        originalConsoleError = console.error;
        console.error = (...args) => consoleMessages.push(args);
        
        errorHandler = new ErrorHandler();
    });

    afterEach(() => {
        // Restaurer console.error
        console.error = originalConsoleError;
    });

    it('should initialize correctly', () => {
        expect(errorHandler).toBeInstanceOf(ErrorHandler);
        expect(errorHandler.errorLog).toEqual([]);
        expect(errorHandler.maxLogSize).toBe(100);
    });

    it('should handle custom errors', () => {
        const testError = {
            type: 'test',
            message: 'Test error message',
            severity: 'error'
        };

        errorHandler.handleError(testError);
        
        expect(errorHandler.errorLog.length).toBe(1);
        expect(errorHandler.errorLog[0].message).toBe('Test error message');
        expect(errorHandler.errorLog[0].type).toBe('test');
    });

    it('should log errors to console', () => {
        errorHandler.logError('Test message', 'custom');
        
        expect(consoleMessages.length).toBe(1);
        expect(consoleMessages[0][0]).toContain('[GR10 Error - custom]');
        expect(consoleMessages[0][1]).toBe('Test message');
    });

    it('should generate unique error IDs', () => {
        const id1 = errorHandler.generateErrorId();
        const id2 = errorHandler.generateErrorId();
        
        expect(id1).toContain('err_');
        expect(id2).toContain('err_');
        expect(id1).not.toBe(id2);
    });

    it('should limit error log size', () => {
        errorHandler.maxLogSize = 3;
        
        for (let i = 0; i < 5; i++) {
            errorHandler.logError(`Error ${i}`, 'test');
        }
        
        expect(errorHandler.errorLog.length).toBe(3);
        expect(errorHandler.errorLog[0].message).toBe('Error 4'); // Plus récent en premier
    });

    it('should provide user-friendly messages', () => {
        const jsError = { type: 'javascript', message: 'Syntax error' };
        const networkError = { type: 'network', message: 'Connection failed' };
        const customError = { type: 'validation', message: 'Invalid data' };
        
        expect(errorHandler.getUserFriendlyMessage(jsError))
            .toBe('Une erreur technique s\'est produite. L\'équipe a été notifiée.');
        expect(errorHandler.getUserFriendlyMessage(networkError))
            .toBe('Problème de connexion réseau. Vérifiez votre connexion internet.');
        expect(errorHandler.getUserFriendlyMessage(customError))
            .toBe('Invalid data');
    });

    it('should determine when to notify users', () => {
        const resourceError = { type: 'resource', message: 'Failed to load favicon.ico' };
        const jsError = { type: 'javascript', message: 'Runtime error' };
        const infoError = { type: 'info', severity: 'info', message: 'Info message' };
        
        expect(errorHandler.shouldNotifyUser(resourceError)).toBeFalsy();
        expect(errorHandler.shouldNotifyUser(jsError)).toBeFalsy(); // localhost
        expect(errorHandler.shouldNotifyUser(infoError)).toBeFalsy();
    });

    it('should provide recent errors', () => {
        errorHandler.logError('Error 1', 'test');
        errorHandler.logError('Error 2', 'test');
        errorHandler.logError('Error 3', 'test');
        
        const recent = errorHandler.getRecentErrors(2);
        expect(recent.length).toBe(2);
        expect(recent[0].message).toBe('Error 3'); // Plus récent en premier
        expect(recent[1].message).toBe('Error 2');
    });

    it('should clear error log', () => {
        errorHandler.logError('Test error', 'test');
        expect(errorHandler.errorLog.length).toBe(1);
        
        errorHandler.clearErrorLog();
        expect(errorHandler.errorLog.length).toBe(0);
    });

    it('should handle warnings and info messages', () => {
        errorHandler.logWarning('Warning message');
        errorHandler.logInfo('Info message');
        
        expect(errorHandler.errorLog.length).toBe(2);
        expect(errorHandler.errorLog[0].message).toBe('Info message');
        expect(errorHandler.errorLog[0].severity).toBe('info');
        expect(errorHandler.errorLog[1].message).toBe('Warning message');
        expect(errorHandler.errorLog[1].severity).toBe('warning');
    });
});
