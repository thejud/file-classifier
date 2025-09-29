/**
 * Application constants
 */

export const KEYBOARD_SHORTCUTS = {
    // Navigation
    PREV: ['ArrowLeft', 'h'],
    NEXT: ['ArrowRight', 'l'],

    // Unrated navigation
    PREV_UNRATED: ['Shift+k'],
    NEXT_UNRATED: ['Shift+j'],

    // Actions
    EXPORT: ['Ctrl+e', 'Meta+e'],
    TOGGLE_MARKDOWN: ['Ctrl+m', 'Meta+m'],
    SHOW_COMMENT: ['m'],
    SHOW_HELP: ['?'],
    CLOSE_MODAL: ['Escape'],

    // Categories (1-9)
    CATEGORIES: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
};

export const UI_STATES = {
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error',
    CLASSIFYING: 'classifying'
};

export const MODAL_TYPES = {
    HELP: 'help',
    COMMENT: 'comment'
};

export const CLASSIFICATION_STATUS = {
    UNCLASSIFIED: 'unclassified',
    CLASSIFIED: 'classified',
    SKIPPED: 'skipped'
};

export const ELEMENT_IDS = {
    // Main layout
    FILENAME: 'filename',
    PROGRESS: 'progress',
    CONTENT_DISPLAY: 'content-display',
    CLASSIFICATION_STATUS: 'classification-status',
    CATEGORY_BUTTONS: 'category-buttons',

    // Navigation
    PREV_BTN: 'prev-btn',
    NEXT_BTN: 'next-btn',
    NAV_PROGRESS: 'nav-progress',

    // Statistics
    STATS_CLASSIFIED: 'stats-classified',
    STATS_SKIPPED: 'stats-skipped',
    STATS_REMAINING: 'stats-remaining',

    // Help modal
    HELP_MODAL: 'help-modal',
    HELP_CLOSE: 'help-close',
    HELP_OVERLAY: 'help-overlay',

    // Comment system
    COMMENT_BTN: 'comment-btn',
    COMMENT_DISPLAY: 'comment-display',
    COMMENT_MODAL: 'comment-modal',
    COMMENT_CLOSE: 'comment-close',
    COMMENT_OVERLAY: 'comment-overlay',
    COMMENT_TEXT: 'comment-text',
    COMMENT_SAVE: 'comment-save',
    COMMENT_DELETE: 'comment-delete',
    COMMENT_CANCEL: 'comment-cancel',

    // Other
    MARKDOWN_INDICATOR: 'markdown-indicator'
};

export const CSS_CLASSES = {
    HIDDEN: 'hidden',
    ACTIVE: 'active',
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning'
};

export const API_ENDPOINTS = {
    STATE: '/api/state',
    ITEM: '/api/item',
    CLASSIFY: '/api/classify',
    COMMENT: '/api/comment',
    EXPORT: '/api/export'
};

export const MARKED_OPTIONS = {
    gfm: true,
    breaks: true,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
};