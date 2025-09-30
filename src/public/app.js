class ClassifierApp {
    constructor() {
        this.state = null;
        this.currentItem = null;
        this.currentIndex = 0;
        this.isClassifying = false; // Prevent rapid classifications
        this.hasInitialized = false; // Track initial load
        this.markdownMode = false; // Track markdown rendering mode
        this.debounceTimeouts = new Map(); // For debouncing rapid actions

        this.elements = {
            filename: document.getElementById('filename'),
            progress: document.getElementById('progress'),
            contentDisplay: document.getElementById('content-display'),
            classificationStatus: document.getElementById('classification-status'),
            categoryButtons: document.getElementById('category-buttons'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            navProgress: document.getElementById('nav-progress'),
            statsClassified: document.getElementById('stats-classified'),
            statsSkipped: document.getElementById('stats-skipped'),
            statsRemaining: document.getElementById('stats-remaining'),
            helpModal: document.getElementById('help-modal'),
            helpClose: document.getElementById('help-close'),
            helpOverlay: document.getElementById('help-overlay'),
            markdownIndicator: document.getElementById('markdown-indicator'),
            commentBtn: document.getElementById('comment-btn'),
            commentDisplay: document.getElementById('comment-display'),
            commentModal: document.getElementById('comment-modal'),
            commentClose: document.getElementById('comment-close'),
            commentOverlay: document.getElementById('comment-overlay'),
            commentText: document.getElementById('comment-text'),
            commentSave: document.getElementById('comment-save'),
            commentDelete: document.getElementById('comment-delete'),
            commentCancel: document.getElementById('comment-cancel'),
        };

        // Configure marked for GitHub-flavored markdown
        marked.setOptions({
            gfm: true,
            breaks: true,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        });

        this.init();
    }

    async init() {
        try {
            // Show initial loading state
            this.showLoading('Initializing application...');

            await this.loadState();
            this.setupEventListeners();
            await this.loadCurrentItem();
            this.updateDisplay();

            // Hide loading state
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.hideLoading();
            this.showError('Failed to load application: ' + error.message);
        }
    }

    async loadState() {
        const response = await fetch('/api/state');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load state');
        }

        this.state = result.data;

        // Only set currentIndex on initial load, not after classification
        if (!this.hasInitialized) {
            this.currentIndex = this.state.currentIndex || 0;
            this.hasInitialized = true;
        }
    }

    setupEventListeners() {
        // Navigation buttons
        this.elements.prevBtn.addEventListener('click', () => this.navigatePrev());
        this.elements.nextBtn.addEventListener('click', () => this.navigateNext());

        // Unified keyboard handler
        document.addEventListener('keydown', (event) => this.handleKeyboard(event));

        // Help modal event listeners
        this.elements.helpClose.addEventListener('click', () => this.hideHelp());
        this.elements.helpOverlay.addEventListener('click', () => this.hideHelp());

        // Comment modal event listeners
        this.elements.commentBtn.addEventListener('click', () => this.showCommentModal());
        this.elements.commentClose.addEventListener('click', () => this.hideCommentModal());
        this.elements.commentOverlay.addEventListener('click', () => this.hideCommentModal());
        this.elements.commentSave.addEventListener('click', () => this.saveComment());
        this.elements.commentDelete.addEventListener('click', () => this.deleteComment());
        this.elements.commentCancel.addEventListener('click', () => this.hideCommentModal());

        // Comment textarea keyboard shortcut (Shift+Enter to save)
        this.elements.commentText.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.shiftKey) {
                event.preventDefault();
                this.saveComment();
            }
        });
    }

    handleKeyboard(event) {
        const key = event.key;

        if (key === 'Escape') {
            event.preventDefault();
            // Close whichever modal is open
            if (!this.elements.helpModal.classList.contains('hidden')) {
                this.hideHelp();
            } else if (!this.elements.commentModal.classList.contains('hidden')) {
                this.hideCommentModal();
            }
            return;
        }

        // Don't handle other shortcuts if any modal is open
        if (!this.elements.helpModal.classList.contains('hidden') ||
            !this.elements.commentModal.classList.contains('hidden')) {
            return;
        }

        // Help modal shortcuts (only when no modal is open)
        if (key === '?' || key === '/') {
            event.preventDefault();
            this.toggleHelp();
            return;
        }

        // Export functionality
        if (key === 'e' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            this.exportResults();
            return;
        }

        // Markdown mode toggle
        if (key === 'm' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            this.toggleMarkdownMode();
            return;
        }

        // Comment modal shortcut (only if no modifier keys are pressed)
        if ((key === 'm' || key === 'M') && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            this.showCommentModal();
            return;
        }

        // Category shortcuts (1-9)
        if (key >= '1' && key <= '9') {
            const categoryIndex = parseInt(key);
            if (categoryIndex <= this.state.config.categories.length) {
                event.preventDefault();
                this.classifyCurrentItem(categoryIndex);
            }
            return;
        }

        // Navigation shortcuts
        switch (key) {
            case 'ArrowLeft':
            case 'h':
                if (event.shiftKey) {
                    event.preventDefault();
                    this.navigateToPrevUnrated();
                } else {
                    event.preventDefault();
                    this.navigatePrev();
                }
                break;
            case 'ArrowRight':
            case 'l':
                if (event.shiftKey) {
                    event.preventDefault();
                    this.navigateToNextUnrated();
                } else {
                    event.preventDefault();
                    this.navigateNext();
                }
                break;
            case 'j':
                if (event.shiftKey) {
                    event.preventDefault();
                    this.navigateToNextUnrated();
                } else {
                    event.preventDefault();
                    this.navigateNext();
                }
                break;
            case 'k':
                if (event.shiftKey) {
                    event.preventDefault();
                    this.navigateToPrevUnrated();
                } else {
                    event.preventDefault();
                    this.navigatePrev();
                }
                break;
            case ' ': // Spacebar to skip
                event.preventDefault();
                this.navigateNext();
                break;
        }
    }

    async loadCurrentItem() {
        if (this.currentIndex < 0 || this.currentIndex >= this.state.totalItems) {
            this.currentItem = null;
            return;
        }

        try {
            const response = await fetch(`/api/item?index=${this.currentIndex}`);
            const result = await response.json();

            if (result.success) {
                this.currentItem = result.data;
            } else {
                throw new Error(result.error || 'Failed to load item');
            }
        } catch (error) {
            console.error('Failed to load current item:', error);
            this.showError('Failed to load content');
        }
    }

    updateDisplay() {
        this.updateHeader();
        this.updateContent();
        this.updateCategoryButtons();
        this.updateClassificationStatus();
        this.updateCommentDisplay();
        this.updateNavigation();
        this.updateStats();
    }

    updateHeader() {
        if (this.currentItem) {
            const filename = this.currentItem.filename || 'Unknown';
            const mode = this.state.config.mode === 'csv' ? 'CSV' : 'File';
            this.elements.filename.textContent = `${filename} (${mode})`;
        } else {
            this.elements.filename.textContent = 'No content';
        }

        this.elements.progress.textContent = `${this.currentIndex + 1}/${this.state.totalItems}`;
    }

    updateContent() {
        if (!this.currentItem) {
            this.elements.contentDisplay.innerHTML = '<div class="loading">No content available</div>';
            return;
        }

        if (this.state.config.mode === 'csv') {
            this.renderCSVContent();
        } else {
            this.renderFileContent();
        }
    }

    renderFileContent() {
        if (this.markdownMode) {
            // Render as markdown
            const markdownHtml = marked.parse(this.currentItem.content);
            this.elements.contentDisplay.innerHTML = `<div class="markdown-content">${markdownHtml}</div>`;
        } else {
            // Render as plain text with line numbers
            const lines = this.currentItem.content.split('\n');
            const html = lines
                .map((line, index) => {
                    const lineNum = index + 1;
                    const escapedLine = this.escapeHtml(line);
                    return `<div class="line"><span class="line-number">${lineNum}</span>${escapedLine}</div>`;
                })
                .join('');

            this.elements.contentDisplay.innerHTML = `<div class="file-content">${html}</div>`;
        }
    }

    renderCSVContent() {
        if (!this.currentItem.csvRow) {
            this.elements.contentDisplay.innerHTML = '<div class="loading">Invalid CSV data</div>';
            return;
        }

        const rows = Object.entries(this.currentItem.csvRow)
            .map(([key, value]) => {
                const escapedKey = this.escapeHtml(key);
                let cellContent;

                if (this.markdownMode) {
                    // Render value as inline markdown (no wrapping <p> tags for table cells)
                    cellContent = marked.parseInline(value || '');
                } else {
                    // Render as plain text with newline expansion
                    cellContent = this.escapeHtmlWithNewlines(value);
                }

                return `<tr><th>${escapedKey}</th><td class="${this.markdownMode ? 'markdown-cell' : ''}">${cellContent}</td></tr>`;
            })
            .join('');

        this.elements.contentDisplay.innerHTML = `
            <table class="csv-table">
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    updateCategoryButtons() {
        const categories = this.state.config.categories;
        const currentClassification = this.getCurrentClassification();

        let html = '';
        categories.forEach((category, index) => {
            const categoryNum = index + 1;
            const isSelected = currentClassification && currentClassification.category === categoryNum;
            const selectedClass = isSelected ? ' selected' : '';

            html += `
                <button class="category-btn${selectedClass}" data-category="${categoryNum}">
                    [${categoryNum}] ${this.escapeHtml(category)}
                </button>
            `;
        });

        this.elements.categoryButtons.innerHTML = html;

        // Add event listeners to category buttons
        this.elements.categoryButtons.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = parseInt(btn.dataset.category);
                this.classifyCurrentItem(category);
            });
        });
    }

    updateClassificationStatus() {
        const classification = this.getCurrentClassification();

        if (classification) {
            const categoryName = classification.categoryName;
            this.elements.classificationStatus.innerHTML = `
                <span style="color: #059669;">✅ ${this.escapeHtml(categoryName)}</span>
            `;
        } else {
            this.elements.classificationStatus.innerHTML = `
                <span style="color: #6b7280;">⚪ Unclassified</span>
            `;
        }
    }

    updateNavigation() {
        // Update button states
        this.elements.prevBtn.disabled = this.currentIndex <= 0;
        this.elements.nextBtn.disabled = this.currentIndex >= this.state.totalItems - 1;

        // Update progress
        this.elements.navProgress.textContent = `${this.currentIndex + 1}/${this.state.totalItems}`;
    }

    updateStats() {
        const classifiedCount = this.state.classifications.length;
        const skippedCount = 0; // We don't track skips separately for now
        const remainingCount = this.state.totalItems - classifiedCount;

        this.elements.statsClassified.textContent = `✅${classifiedCount}`;
        this.elements.statsSkipped.textContent = `⏭${skippedCount}`;
        this.elements.statsRemaining.textContent = `⏳${remainingCount}`;
    }

    async classifyCurrentItem(category) {
        if (!this.currentItem || this.isClassifying) {
            return;
        }

        this.isClassifying = true;

        // Show visual feedback during classification
        this.elements.classificationStatus.innerHTML = `
            <span style="color: #6b7280;">⏳ Classifying...</span>
        `;

        try {
            const response = await fetch('/api/classify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemIndex: this.currentIndex,
                    category: category,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Update local state
                await this.loadState();
                this.updateDisplay();

                // Auto-navigate to next item (only if not on last item)
                if (this.currentIndex < this.state.totalItems - 1) {
                    this.navigateNext();
                }
            } else {
                throw new Error(result.error || 'Classification failed');
            }
        } catch (error) {
            console.error('Classification error:', error);
            this.showError('Failed to classify item');
        } finally {
            this.isClassifying = false;
        }
    }

    async navigatePrev() {
        this.debounce('navigate', async () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                await this.loadCurrentItem();
                this.updateDisplay();
            }
        });
    }

    async navigateNext() {
        this.debounce('navigate', async () => {
            if (this.currentIndex < this.state.totalItems - 1) {
                this.currentIndex++;
                await this.loadCurrentItem();
                this.updateDisplay();
            }
        });
    }

    async navigateToNextUnrated() {
        const startIndex = this.currentIndex + 1;
        let foundIndex = -1;

        // Search forward for next unrated item
        for (let i = startIndex; i < this.state.totalItems; i++) {
            const response = await fetch(`/api/item?index=${i}`);
            const result = await response.json();
            if (result.success) {
                const item = result.data;
                const isClassified = this.state.classifications.find(c => c.itemId === item.id);
                if (!isClassified) {
                    foundIndex = i;
                    break;
                }
            }
        }

        if (foundIndex !== -1) {
            this.currentIndex = foundIndex;
            await this.loadCurrentItem();
            this.updateDisplay();
        }
        // If no unrated items found, do nothing (stay at current position)
    }

    async navigateToPrevUnrated() {
        const startIndex = this.currentIndex - 1;
        let foundIndex = -1;

        // Search backward for previous unrated item
        for (let i = startIndex; i >= 0; i--) {
            const response = await fetch(`/api/item?index=${i}`);
            const result = await response.json();
            if (result.success) {
                const item = result.data;
                const isClassified = this.state.classifications.find(c => c.itemId === item.id);
                if (!isClassified) {
                    foundIndex = i;
                    break;
                }
            }
        }

        if (foundIndex !== -1) {
            this.currentIndex = foundIndex;
            await this.loadCurrentItem();
            this.updateDisplay();
        }
        // If no unrated items found, do nothing (stay at current position)
    }

    getCurrentClassification() {
        if (!this.currentItem) {
            return null;
        }

        return this.state.classifications.find(c => c.itemId === this.currentItem.id);
    }

    async exportResults() {
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
            });

            const result = await response.json();

            if (result.success) {
                this.downloadJSON(result.data, `classifications-${Date.now()}.json`);
            } else {
                throw new Error(result.error || 'Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export results');
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper toast system
        console.error(message);
        alert(message);
    }

    showLoading(message = 'Loading...') {
        if (this.elements.contentDisplay) {
            this.elements.contentDisplay.innerHTML = `<div class="loading">${this.escapeHtml(message)}</div>`;
        }
    }

    hideLoading() {
        // Loading will be replaced by content when updateDisplay is called
    }

    /**
     * Debounce function calls to prevent rapid execution
     * @param {string} key - Unique key for the debounced function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     */
    debounce(key, func, wait = 150) {
        // Clear existing timeout
        if (this.debounceTimeouts.has(key)) {
            clearTimeout(this.debounceTimeouts.get(key));
        }

        // Set new timeout
        const timeoutId = setTimeout(() => {
            this.debounceTimeouts.delete(key);
            func();
        }, wait);

        this.debounceTimeouts.set(key, timeoutId);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeHtmlWithNewlines(text) {
        // First escape HTML, then convert newlines to <br> tags
        const escaped = this.escapeHtml(text);
        return escaped.replace(/\n/g, '<br>');
    }

    // Help modal methods
    showHelp() {
        this.elements.helpModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    hideHelp() {
        this.elements.helpModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    }

    toggleHelp() {
        if (this.elements.helpModal.classList.contains('hidden')) {
            this.showHelp();
        } else {
            this.hideHelp();
        }
    }

    // Markdown mode methods
    toggleMarkdownMode() {
        this.markdownMode = !this.markdownMode;
        this.updateMarkdownIndicator();
        this.updateContent(); // Re-render content with new mode
    }

    updateMarkdownIndicator() {
        if (this.markdownMode) {
            this.elements.markdownIndicator.classList.remove('hidden');
        } else {
            this.elements.markdownIndicator.classList.add('hidden');
        }
    }

    // Comment methods
    updateCommentDisplay() {
        const classification = this.getCurrentClassification();
        const comment = classification?.comment;

        if (comment && comment.trim()) {
            this.elements.commentDisplay.innerHTML = `
                <div class="comment-preview">
                    <strong>💬 Comment:</strong> ${this.escapeHtml(comment)}
                </div>
            `;
            this.elements.commentDisplay.classList.remove('hidden');
        } else {
            this.elements.commentDisplay.innerHTML = '';
            this.elements.commentDisplay.classList.add('hidden');
        }
    }

    showCommentModal() {
        const classification = this.getCurrentClassification();
        const existingComment = classification?.comment || '';

        this.elements.commentText.value = existingComment;
        this.elements.commentModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Focus the textarea
        setTimeout(() => {
            this.elements.commentText.focus();
        }, 100);

        // Update delete button visibility
        this.elements.commentDelete.style.display = existingComment ? 'block' : 'none';
    }

    hideCommentModal() {
        this.elements.commentModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    async saveComment() {
        const comment = this.elements.commentText.value.trim();

        if (!comment) {
            this.showError('Comment cannot be empty. Use Delete to remove an existing comment.');
            return;
        }

        try {
            const response = await fetch('/api/comment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemIndex: this.currentIndex,
                    comment: comment,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Reload state to get updated classification with comment
                await this.loadState();
                await this.loadCurrentItem();
                this.updateDisplay();
                this.hideCommentModal();
            } else {
                throw new Error(result.error || 'Failed to save comment');
            }
        } catch (error) {
            console.error('Save comment error:', error);
            this.showError('Failed to save comment');
        }
    }

    async deleteComment() {
        try {
            const response = await fetch(`/api/comment?index=${this.currentIndex}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                // Reload state to get updated classification without comment
                await this.loadState();
                await this.loadCurrentItem();
                this.updateDisplay();
                this.hideCommentModal();
            } else {
                throw new Error(result.error || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Delete comment error:', error);
            this.showError('Failed to delete comment');
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ClassifierApp();
});