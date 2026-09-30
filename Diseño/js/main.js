/* Arranque de la aplicacion: menu movil, navegacion activa y salud de la API. */
(function () {
    'use strict';

    const ui = window.App.ui;

    function initMenu() {
        const toggle = document.querySelector('.nav__toggle');
        const menu = document.getElementById('nav-menu');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', function () {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!isOpen));
            toggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Cerrar menu');
            menu.classList.toggle('is-open', !isOpen);
        });

        menu.addEventListener('click', function (event) {
            if (event.target.tagName === 'A') {
                toggle.setAttribute('aria-expanded', 'false');
                menu.classList.remove('is-open');
            }
        });
    }

    function initModal() {
        const modal = document.getElementById('detail-modal');
        if (!modal) return;

        modal.addEventListener('click', function (event) {
            if (event.target.closest('[data-close-modal]')) ui.closeModal('detail-modal');
            if (event.target === modal) ui.closeModal('detail-modal');
        });
    }

    function initActiveLink() {
        const links = document.querySelectorAll('.nav__menu a');
        const sections = document.querySelectorAll('main section[id]');
        if (!links.length || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    links.forEach(function (link) {
                        link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
                    });
                });
            },
            { rootMargin: '-45% 0px -50% 0px' }
        );

        sections.forEach(function (section) { observer.observe(section); });
    }

    async function checkApi() {
        ui.setApiStatus('idle', 'Comprobando API...');
        try {
            const result = await window.App.api.health();
            ui.setApiStatus('online', 'API conectada');
            ui.toastSuccess(result.detail);
            return true;
        } catch (error) {
            ui.setApiStatus('offline', 'API no disponible');
            ui.showToast(
                'La API no responde en ' + window.App.api.BASE_URL + '. Arrancala con: uvicorn app.main:app --reload',
                'error',
                9000
            );
            return false;
        }
    }

    async function ensureSeedData() {
        try {
            await window.App.api.seed();
        } catch (error) {
            // Si la API no esta levantada el error ya se mostro en el aviso de salud.
        }
    }

    let started = false;

    async function start() {
        if (started) return;
        started = true;

        initMenu();
        initModal();
        initActiveLink();
        window.App.docs.init();

        const online = await checkApi();
        if (online) {
            await ensureSeedData();
            await window.App.recipes.init();
            await window.App.catalog.init();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
