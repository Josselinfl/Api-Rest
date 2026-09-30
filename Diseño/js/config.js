/* Configuracion global del cliente. Cambia API_ORIGIN si tu backend corre en otro puerto. */
window.App = window.App || {};

window.App.config = {
    API_ORIGIN: 'http://localhost:8000',
    API_PREFIX: '/api/v1',
    get BASE_URL() {
        return this.API_ORIGIN + this.API_PREFIX;
    },
    REQUEST_TIMEOUT: 10000,
    DIFFICULTY_LABELS: {
        facil: 'Facil',
        media: 'Media',
        dificil: 'Dificil'
    }
};
