/**
 * ApiService - Centralized API communication
 */
export class ApiService {
    constructor() {
        this.baseUrl = '';
    }

    async loadState() {
        const response = await fetch('/api/state');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load state');
        }

        return result.data;
    }

    async loadItem(index) {
        const response = await fetch(`/api/item/${index}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load item');
        }

        return result.data;
    }

    async classify(itemIndex, category) {
        const response = await fetch('/api/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemIndex,
                category,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to classify item');
        }

        return result;
    }

    async saveComment(itemIndex, comment) {
        const response = await fetch('/api/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemIndex,
                comment,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to save comment');
        }

        return result;
    }

    async deleteComment(itemIndex) {
        const response = await fetch(`/api/comment?index=${itemIndex}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to delete comment');
        }

        return result;
    }

    async exportResults() {
        const response = await fetch('/api/export', {
            method: 'POST',
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'classifications.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            throw new Error('Failed to export results');
        }
    }
}