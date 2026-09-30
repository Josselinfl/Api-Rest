/* Utilidades de interfaz: toasts, escapado de HTML, formatos y estado de carga. */
window.App = window.App || {};

window.App.ui = (function () {
    'use strict';

    const TOAST_DURATION = 4200;

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES').format(Number(value) || 0);
    }

    function showToast(message, type, timeout) {
        const container = document.getElementById('toasts');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast toast--' + (type || 'success');
        toast.textContent = message;
        container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add('is-hiding');
            window.setTimeout(() => toast.remove(), 260);
        }, timeout || TOAST_DURATION);
    }

    const toastSuccess = (message) => showToast(message, 'success');
    const toastError = (error) => showToast(normalizeMessage(error), 'error', 6000);
    const toastInfo = (message) => showToast(message, 'info');

    function normalizeMessage(error) {
        if (!error) return 'Ha ocurrido un error inesperado.';
        if (typeof error === 'string') return error;
        return error.message || 'Ha ocurrido un error inesperado.';
    }

    function setLoading(isLoading, spinnerId) {
        const spinner = document.getElementById(spinnerId);
        if (spinner) spinner.hidden = !isLoading;
    }

    function setApiStatus(state, label) {
        const badge = document.getElementById('api-status');
        if (!badge) return;
        badge.dataset.state = state;
        badge.querySelector('.api-status__label').textContent = label;
    }

    function showFormError(elementId, message) {
        const box = document.getElementById(elementId);
        if (!box) return;
        box.textContent = message;
        box.hidden = !message;
    }

    function clearFormError(elementId) {
        showFormError(elementId, '');
    }

    function openModal(modalId, html) {
        const modal = document.getElementById(modalId);
        const body = document.getElementById('detail-modal-body');
        if (!modal || !body) return;

        body.innerHTML = html;
        if (typeof modal.showModal === 'function') {
            modal.showModal();
        } else {
            modal.setAttribute('open', 'open');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        if (typeof modal.close === 'function') {
            modal.close();
        } else {
            modal.removeAttribute('open');
        }
    }

    function confirmDelete(message) {
        return window.confirm(message);
    }

    function buildQuery(params) {
        return Object.keys(params)
            .filter((key) => params[key] !== '' && params[key] !== null && params[key] !== undefined)
            .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
    }

    return {
        escapeHtml: escapeHtml,
        formatNumber: formatNumber,
        showToast: showToast,
        toastSuccess: toastSuccess,
        toastError: toastError,
        toastInfo: toastInfo,
        normalizeMessage: normalizeMessage,
        setLoading: setLoading,
        setApiStatus: setApiStatus,
        showFormError: showFormError,
        clearFormError: clearFormError,
        openModal: openModal,
        closeModal: closeModal,
        confirmDelete: confirmDelete,
        buildQuery: buildQuery
    };
})();
