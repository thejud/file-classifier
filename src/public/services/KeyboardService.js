/**
 * KeyboardService - Unified keyboard handling for the application
 */
export class KeyboardService {
    constructor() {
        this.handlers = new Map();
        this.modalHandlers = new Map();
        this.isModalOpen = false;

        // Bind the main keyboard handler
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Register a keyboard shortcut
     * @param {string} key - The key to listen for
     * @param {Object} options - Options object
     * @param {Function} handler - Function to call when key is pressed
     * @param {string} context - 'global' or 'modal'
     */
    register(key, options = {}, handler, context = 'global') {
        const {
            ctrlKey = false,
            metaKey = false,
            shiftKey = false,
            altKey = false,
            preventDefault = true
        } = options;

        const keyCombo = this.getKeyCombo(key, { ctrlKey, metaKey, shiftKey, altKey });
        const handlerInfo = { handler, preventDefault };

        if (context === 'modal') {
            this.modalHandlers.set(keyCombo, handlerInfo);
        } else {
            this.handlers.set(keyCombo, handlerInfo);
        }
    }

    /**
     * Unregister a keyboard shortcut
     * @param {string} key - The key
     * @param {Object} options - Options object
     * @param {string} context - 'global' or 'modal'
     */
    unregister(key, options = {}, context = 'global') {
        const keyCombo = this.getKeyCombo(key, options);

        if (context === 'modal') {
            this.modalHandlers.delete(keyCombo);
        } else {
            this.handlers.delete(keyCombo);
        }
    }

    /**
     * Set modal state - affects which handlers are active
     * @param {boolean} isOpen - Whether a modal is currently open
     */
    setModalState(isOpen) {
        this.isModalOpen = isOpen;
    }

    /**
     * Main keyboard event handler
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeydown(event) {
        // Handle Escape key specially - always closes modals
        if (event.key === 'Escape') {
            const escapeHandler = this.handlers.get('Escape');
            if (escapeHandler) {
                if (escapeHandler.preventDefault) {
                    event.preventDefault();
                }
                escapeHandler.handler(event);
            }
            return;
        }

        const keyCombo = this.getKeyCombo(event.key, {
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey
        });

        // Check modal handlers first if modal is open
        if (this.isModalOpen) {
            const modalHandler = this.modalHandlers.get(keyCombo);
            if (modalHandler) {
                if (modalHandler.preventDefault) {
                    event.preventDefault();
                }
                modalHandler.handler(event);
                return;
            }
        }

        // Check global handlers
        const globalHandler = this.handlers.get(keyCombo);
        if (globalHandler) {
            if (globalHandler.preventDefault) {
                event.preventDefault();
            }
            globalHandler.handler(event);
        }
    }

    /**
     * Generate a unique key combination string
     * @param {string} key - The key
     * @param {Object} modifiers - Modifier keys
     * @returns {string} - Key combination string
     */
    getKeyCombo(key, modifiers = {}) {
        const { ctrlKey, metaKey, shiftKey, altKey } = modifiers;
        const parts = [];

        if (ctrlKey) parts.push('Ctrl');
        if (metaKey) parts.push('Meta');
        if (shiftKey) parts.push('Shift');
        if (altKey) parts.push('Alt');

        parts.push(key);

        return parts.join('+');
    }

    /**
     * Register common application shortcuts
     * @param {Object} handlers - Object with handler functions
     */
    registerApplicationShortcuts(handlers) {
        const {
            onClassify,
            onNavigateNext,
            onNavigatePrev,
            onExport,
            onToggleMarkdown,
            onShowComment,
            onShowHelp,
            onEscape,
            onNavigateUnrated
        } = handlers;

        // Category shortcuts (1-9)
        for (let i = 1; i <= 9; i++) {
            this.register(i.toString(), {}, (event) => {
                if (onClassify) onClassify(i, event);
            });
        }

        // Navigation shortcuts
        this.register('ArrowLeft', {}, onNavigatePrev);
        this.register('ArrowRight', {}, onNavigateNext);
        this.register('h', {}, onNavigatePrev);
        this.register('l', {}, onNavigateNext);

        // Unrated navigation shortcuts
        this.register('j', { shiftKey: true }, () => {
            if (onNavigateUnrated) onNavigateUnrated('next');
        });
        this.register('k', { shiftKey: true }, () => {
            if (onNavigateUnrated) onNavigateUnrated('prev');
        });

        // Export shortcut
        this.register('e', { ctrlKey: true }, onExport);
        this.register('e', { metaKey: true }, onExport);

        // Markdown toggle
        this.register('m', { ctrlKey: true }, onToggleMarkdown);
        this.register('m', { metaKey: true }, onToggleMarkdown);

        // Comment modal (only if no modifiers)
        this.register('m', {}, (event) => {
            // Only trigger if no modifier keys are pressed
            if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                if (onShowComment) onShowComment(event);
            }
        });

        // Help modal
        this.register('?', {}, onShowHelp);

        // Escape (close modals)
        this.register('Escape', {}, onEscape);
    }

    /**
     * Check if a key combination would conflict with existing handlers
     * @param {string} key - The key
     * @param {Object} modifiers - Modifier keys
     * @param {string} context - 'global' or 'modal'
     * @returns {boolean} - True if there's a conflict
     */
    hasConflict(key, modifiers = {}, context = 'global') {
        const keyCombo = this.getKeyCombo(key, modifiers);

        if (context === 'modal') {
            return this.modalHandlers.has(keyCombo);
        } else {
            return this.handlers.has(keyCombo);
        }
    }

    /**
     * Get all registered shortcuts for debugging
     * @returns {Object} - Object with global and modal handlers
     */
    getRegisteredShortcuts() {
        return {
            global: Array.from(this.handlers.keys()),
            modal: Array.from(this.modalHandlers.keys())
        };
    }
}