/**
 * StateManager - Centralized state management with observer pattern
 */
export class StateManager {
    constructor(apiService) {
        this.apiService = apiService;
        this.state = {
            currentIndex: 0,
            items: [],
            classifications: [],
            config: {
                categories: [],
                mode: 'file',
                sources: []
            },
            ui: {
                markdownMode: false,
                isLoading: false
            }
        };
        this.subscribers = [];
        this.hasInitialized = false;
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Function to call when state changes
     * @returns {Function} - Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Update state and notify subscribers
     * @param {Object} updates - Partial state updates
     */
    setState(updates) {
        const prevState = { ...this.state };
        this.state = this.mergeDeep(this.state, updates);

        // Notify all subscribers
        this.notify(prevState, this.state);
    }

    /**
     * Get current state (readonly)
     * @returns {Object} - Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Initialize state from API
     */
    async initialize() {
        try {
            this.setState({ ui: { ...this.state.ui, isLoading: true } });

            const serverState = await this.apiService.loadState();

            // Only set currentIndex on initial load
            const currentIndex = this.hasInitialized ? this.state.currentIndex : (serverState.currentIndex || 0);

            this.setState({
                ...serverState,
                currentIndex,
                ui: { ...this.state.ui, isLoading: false }
            });

            this.hasInitialized = true;
        } catch (error) {
            this.setState({ ui: { ...this.state.ui, isLoading: false } });
            throw error;
        }
    }

    /**
     * Refresh state from server without changing current index
     */
    async refreshState() {
        try {
            const serverState = await this.apiService.loadState();

            // Preserve current index and UI state
            this.setState({
                ...serverState,
                currentIndex: this.state.currentIndex,
                ui: this.state.ui
            });
        } catch (error) {
            console.error('Failed to refresh state:', error);
            throw error;
        }
    }

    /**
     * Navigate to specific index
     * @param {number} index - Target index
     */
    navigateToIndex(index) {
        const maxIndex = Math.max(0, this.state.items.length - 1);
        const newIndex = Math.max(0, Math.min(index, maxIndex));

        this.setState({ currentIndex: newIndex });
    }

    /**
     * Navigate to next item
     */
    navigateNext() {
        this.navigateToIndex(this.state.currentIndex + 1);
    }

    /**
     * Navigate to previous item
     */
    navigatePrev() {
        this.navigateToIndex(this.state.currentIndex - 1);
    }

    /**
     * Toggle markdown mode
     */
    toggleMarkdownMode() {
        this.setState({
            ui: {
                ...this.state.ui,
                markdownMode: !this.state.ui.markdownMode
            }
        });
    }

    /**
     * Get current item
     * @returns {Object|null} - Current item or null
     */
    getCurrentItem() {
        return this.state.items[this.state.currentIndex] || null;
    }

    /**
     * Get current classification
     * @returns {Object|null} - Current classification or null
     */
    getCurrentClassification() {
        const currentItem = this.state.items[this.state.currentIndex];
        if (!currentItem) return null;
        return this.state.classifications?.find(c => c.itemId === currentItem.id) || null;
    }

    /**
     * Get statistics
     * @returns {Object} - Statistics object
     */
    getStatistics() {
        const totalItems = this.state.items.length;
        const classifiedCount = this.state.classifications?.length || 0;
        const skippedCount = 0; // Not implemented yet
        const remainingCount = totalItems - classifiedCount - skippedCount;

        return {
            total: totalItems,
            classified: classifiedCount,
            skipped: skippedCount,
            remaining: remainingCount
        };
    }

    /**
     * Deep merge objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} - Merged object
     */
    mergeDeep(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeDeep(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Notify all subscribers of state changes
     * @param {Object} prevState - Previous state
     * @param {Object} newState - New state
     */
    notify(prevState, newState) {
        this.subscribers.forEach(callback => {
            try {
                callback(newState, prevState);
            } catch (error) {
                console.error('Error in state subscriber:', error);
            }
        });
    }
}