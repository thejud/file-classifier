/**
 * DOM Helper utilities
 */

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement} - The element
 * @throws {Error} - If element not found
 */
export function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with ID '${id}' not found`);
    }
    return element;
}

/**
 * Get multiple elements by IDs
 * @param {string[]} ids - Array of element IDs
 * @returns {Object} - Object with element references
 */
export function getElementsByIds(ids) {
    const elements = {};
    ids.forEach(id => {
        elements[id] = getElementById(id);
    });
    return elements;
}

/**
 * Show/hide element
 * @param {HTMLElement} element - Element to show/hide
 * @param {boolean} visible - Whether to show the element
 */
export function setVisible(element, visible) {
    if (visible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Add event listener with cleanup
 * @param {HTMLElement} element - Element to add listener to
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @returns {Function} - Cleanup function
 */
export function addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string|HTMLElement} content - Element content
 * @returns {HTMLElement} - Created element
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });

    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    }

    return element;
}

/**
 * Wait for element to be visible
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<HTMLElement>} - Promise that resolves with the element
 */
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}