/**
 * Custom Alert Utilities
 * Replaces native browser alerts with toast notifications and SweetAlert2
 * Using react-hot-toast for consistent notifications
 */

import { toast } from 'react-hot-toast';

/**
 * Show success message
 * @param {string} message - Success message to display
 * @param {number} duration - Duration in ms (default: 3000)
 */
export const showSuccess = (message, duration = 3000) => {
    toast.success(message, {
        duration,
        position: 'top-right',
        style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }
    });
};

/**
 * Show error message
 * @param {string} message - Error message to display
 * @param {number} duration - Duration in ms (default: 4000)
 */
export const showError = (message, duration = 4000) => {
    toast.error(message, {
        duration,
        position: 'top-right',
        style: {
            background: '#EF4444',
            color: '#fff',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }
    });
};

/**
 * Show info/loading message
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default: 3000)
 */
export const showInfo = (message, duration = 3000) => {
    return toast(message, {
        duration,
        position: 'top-right',
        style: {
            background: '#3B82F6',
            color: '#fff',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        },
        icon: 'ℹ️'
    });
};

/**
 * Show warning message
 * @param {string} message - Warning message to display
 * @param {number} duration - Duration in ms (default: 3500)
 */
export const showWarning = (message, duration = 3500) => {
    toast(message, {
        duration,
        position: 'top-right',
        style: {
            background: '#F59E0B',
            color: '#fff',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        },
        icon: '⚠️'
    });
};

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Confirm button text (default: "Yes")
 * @param {string} cancelText - Cancel button text (default: "No")
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
export const showConfirm = (title, message, confirmText = 'Yes', cancelText = 'No') => {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Title
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            color: #1F2937;
        `;

        // Message
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            margin: 0 0 24px 0;
            font-size: 14px;
            color: #6B7280;
            line-height: 1.5;
        `;

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        `;

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = `
            padding: 10px 16px;
            border: 1px solid #D1D5DB;
            background: #F3F4F6;
            color: #374151;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        `;
        cancelBtn.onmouseover = () => {
            cancelBtn.style.background = '#E5E7EB';
        };
        cancelBtn.onmouseout = () => {
            cancelBtn.style.background = '#F3F4F6';
        };
        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };

        // Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmText;
        confirmBtn.style.cssText = `
            padding: 10px 16px;
            background: #EF4444;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        `;
        confirmBtn.onmouseover = () => {
            confirmBtn.style.background = '#DC2626';
        };
        confirmBtn.onmouseout = () => {
            confirmBtn.style.background = '#EF4444';
        };
        confirmBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        // Cleanup function
        const cleanup = () => {
            overlay.remove();
            style.remove();
        };

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false);
            }
        };

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEscape);
                cleanup();
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Assemble modal
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(confirmBtn);
        modal.appendChild(titleEl);
        modal.appendChild(messageEl);
        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Focus confirm button
        confirmBtn.focus();
    });
};

/**
 * Show loading toast (doesn't auto-close)
 * @param {string} message - Loading message
 * @returns {string} - Toast ID for later dismissal
 */
export const showLoading = (message = 'Loading...') => {
    return toast.loading(message, {
        position: 'top-right',
        style: {
            background: '#3B82F6',
            color: '#fff',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '8px'
        }
    });
};

/**
 * Dismiss a toast by ID
 * @param {string} toastId - Toast ID returned from showLoading
 */
export const dismissToast = (toastId) => {
    toast.dismiss(toastId);
};

/**
 * Copy to clipboard with toast notification
 * @param {string} text - Text to copy
 * @param {string} message - Success message (default: "Copied to clipboard!")
 */
export const copyToClipboard = async (text, message = 'Copied to clipboard!') => {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess(message);
        return true;
    } catch (error) {
        showError('Failed to copy to clipboard');
        return false;
    }
};

export default {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirm,
    showLoading,
    dismissToast,
    copyToClipboard
};
