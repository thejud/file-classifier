/**
 * CommentModal - Handles comment functionality for classification items
 */
export class CommentModal {
    constructor(apiService, stateManager) {
        this.apiService = apiService;
        this.stateManager = stateManager;

        this.elements = {
            modal: document.getElementById('comment-modal'),
            close: document.getElementById('comment-close'),
            overlay: document.getElementById('comment-overlay'),
            text: document.getElementById('comment-text'),
            save: document.getElementById('comment-save'),
            delete: document.getElementById('comment-delete'),
            cancel: document.getElementById('comment-cancel'),
            display: document.getElementById('comment-display'),
            btn: document.getElementById('comment-btn'),
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal event listeners
        this.elements.btn.addEventListener('click', () => this.show());
        this.elements.close.addEventListener('click', () => this.hide());
        this.elements.overlay.addEventListener('click', () => this.hide());
        this.elements.save.addEventListener('click', () => this.save());
        this.elements.delete.addEventListener('click', () => this.delete());
        this.elements.cancel.addEventListener('click', () => this.hide());

        // Comment textarea keyboard shortcut (Shift+Enter to save)
        this.elements.text.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.shiftKey) {
                event.preventDefault();
                this.save();
            }
        });
    }

    show() {
        const currentState = this.stateManager.getState();
        const classification = this.getCurrentClassification(currentState);
        const existingComment = classification?.comment || '';

        this.elements.text.value = existingComment;
        this.elements.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Focus the textarea
        setTimeout(() => {
            this.elements.text.focus();
        }, 100);

        // Update delete button visibility
        this.elements.delete.style.display = existingComment ? 'block' : 'none';
    }

    hide() {
        this.elements.modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    async save() {
        const comment = this.elements.text.value.trim();

        if (!comment) {
            this.showError('Comment cannot be empty. Use Delete to remove an existing comment.');
            return;
        }

        try {
            const currentState = this.stateManager.getState();
            const response = await this.apiService.saveComment(currentState.currentIndex, comment);

            if (response.success) {
                // Update state and refresh display
                await this.stateManager.refreshState();
                this.hide();
                this.updateDisplay();
            } else {
                throw new Error(response.error || 'Failed to save comment');
            }
        } catch (error) {
            console.error('Save comment error:', error);
            this.showError('Failed to save comment');
        }
    }

    async delete() {
        try {
            const currentState = this.stateManager.getState();
            const response = await this.apiService.deleteComment(currentState.currentIndex);

            if (response.success) {
                // Update state and refresh display
                await this.stateManager.refreshState();
                this.hide();
                this.updateDisplay();
            } else {
                throw new Error(response.error || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Delete comment error:', error);
            this.showError('Failed to delete comment');
        }
    }

    updateDisplay() {
        const currentState = this.stateManager.getState();
        const classification = this.getCurrentClassification(currentState);
        const comment = classification?.comment;

        if (comment && comment.trim()) {
            this.elements.display.innerHTML = `
                <div class="comment-preview">
                    <strong>💬 Comment:</strong> ${this.escapeHtml(comment)}
                </div>
            `;
            this.elements.display.classList.remove('hidden');
        } else {
            this.elements.display.classList.add('hidden');
        }
    }

    getCurrentClassification(state) {
        const currentItem = state.items?.[state.currentIndex];
        if (!currentItem) return null;
        return state.classifications?.find(c => c.itemId === currentItem.id);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // For now, use alert. This could be replaced with a proper error notification system
        alert(message);
    }

    isVisible() {
        return !this.elements.modal.classList.contains('hidden');
    }
}