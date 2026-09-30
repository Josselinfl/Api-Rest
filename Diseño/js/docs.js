/* Documentacion interactiva: tabla de endpoints y consola para ejecutar peticiones reales. */
window.App = window.App || {};

window.App.docs = (function () {
    'use strict';

    const { escapeHtml } = window.App.ui;

    const ENDPOINTS = [
        {
            method: 'GET',
            path: '/recipes',
            description: 'Lista recetas con la categoria y el numero de ingredientes ya resueltos.',
            params: 'search, category_id, ingredient_id, difficulty, page, page_size, sort_by, order',
            example: '/recipes?category_id=1&page_size=6'
        },
        {
            method: 'POST',
            path: '/recipes',
            description: 'Crea una receta junto con su lista N:M de ingredientes.',
            params: 'title*, category_id*, servings, prep_minutes, cook_minutes, difficulty, ingredients[]',
            example: '/recipes',
            body: {
                title: 'Pizza de prueba',
                description: 'Ejemplo de payload documentado',
                servings: 4,
                prep_minutes: 20,
                cook_minutes: 12,
                difficulty: 'media',
                category_id: 1,
                ingredients: [
                    { ingredient_id: 1, quantity: 500, note: 'para la masa' },
                    { ingredient_id: 5, quantity: 250, note: 'en lonchas' }
                ]
            },
            note: 'Crea una receta nueva cada vez que se ejecuta.'
        },
        {
            method: 'GET',
            path: '/recipes/{recipe_id}',
            description: 'Devuelve una receta con todos sus ingredientes y su categoria.',
            params: 'recipe_id*',
            example: '/recipes/1'
        },
        {
            method: 'PUT',
            path: '/recipes/{recipe_id}',
            description: 'Actualizacion parcial: los campos omitidos se conservan.',
            params: 'title, description, servings, difficulty, category_id, ingredients[]',
            example: '/recipes/1',
            body: {
                title: 'Pizza editada desde la documentacion',
                difficulty: 'facil',
                ingredients: [{ ingredient_id: 1, quantity: 400 }]
            }
        },
        {
            method: 'DELETE',
            path: '/recipes/{recipe_id}',
            description: 'Elimina la receta y sus filas de la tabla puente.',
            params: 'recipe_id*',
            example: '/recipes/999',
            note: 'Ejecuta primero un POST para tener una receta que borrar.'
        },
        {
            method: 'GET',
            path: '/recipes/{recipe_id}/ingredients',
            description: 'Solo los ingredientes de una receta (recurso anidado de la relacion N:M).',
            params: 'recipe_id*',
            example: '/recipes/1/ingredients'
        },
        {
            method: 'GET',
            path: '/categories',
            description: 'Lista categorias con el contador de recetas de cada una.',
            params: 'search, page, page_size',
            example: '/categories?page_size=10'
        },
        {
            method: 'POST',
            path: '/categories',
            description: 'Crea una categoria. El slug se genera a partir del nombre.',
            params: 'name*, description',
            example: '/categories',
            body: { name: 'Categoria de ejemplo', description: 'Creada desde la documentacion' },
            note: 'Devuelve 400 si el nombre ya existe.'
        },
        {
            method: 'PATCH',
            path: '/categories/{category_id}',
            description: 'Actualiza parcialmente una categoria existente.',
            params: 'name, description',
            example: '/categories/1',
            body: { description: 'Descripcion actualizada desde la documentacion' }
        },
        {
            method: 'DELETE',
            path: '/categories/{category_id}',
            description: 'Elimina una categoria. Responde 409 si tiene recetas asociadas.',
            params: 'category_id*',
            example: '/categories/999'
        },
        {
            method: 'GET',
            path: '/ingredients',
            description: 'Lista ingredientes. Puede filtrar por los usados en una receta.',
            params: 'search, used_in_recipe, page, page_size',
            example: '/ingredients?used_in_recipe=1'
        },
        {
            method: 'POST',
            path: '/ingredients',
            description: 'Crea un ingrediente reutilizable en multiples recetas.',
            params: 'name*, unit, calories',
            example: '/ingredients',
            body: { name: 'Ingrediente de ejemplo', unit: 'g', calories: 120 }
        },
        {
            method: 'PATCH',
            path: '/ingredients/{ingredient_id}',
            description: 'Actualiza parcialmente un ingrediente.',
            params: 'name, unit, calories',
            example: '/ingredients/1',
            body: { unit: 'kg' }
        },
        {
            method: 'DELETE',
            path: '/ingredients/{ingredient_id}',
            description: 'Elimina un ingrediente. Responde 409 si esta en uso.',
            params: 'ingredient_id*',
            example: '/ingredients/999'
        },
        {
            method: 'GET',
            path: '/health',
            description: 'Comprueba que la API y la base de datos responden.',
            params: '-',
            example: '/health'
        },
        {
            method: 'POST',
            path: '/seed',
            description: 'Carga el catalogo de ejemplo. Es idempotente.',
            params: '-',
            example: '/seed'
        }
    ];

    function renderTable() {
        const tbody = document.getElementById('endpoints-body');
        if (!tbody) return;

        tbody.innerHTML = ENDPOINTS.map(function (endpoint) {
            const method = endpoint.method.toLowerCase();
            return (
                '<tr>' +
                '<td><span class="method method--' + method + '">' + endpoint.method + '</span></td>' +
                '<td><code class="endpoint-path">' + escapeHtml(endpoint.path) + '</code></td>' +
                '<td>' + escapeHtml(endpoint.description) + '</td>' +
                '<td class="endpoint-params">' + escapeHtml(endpoint.params) + '</td>' +
                '<td><button class="btn btn--icon" type="button" data-endpoint="' +
                escapeHtml(endpoint.example) + '" data-method="' + endpoint.method + '">Probar</button></td>' +
                '</tr>'
            );
        }).join('');
    }

    function bindTable() {
        const tbody = document.getElementById('endpoints-body');
        if (!tbody) return;

        tbody.addEventListener('click', function (event) {
            const button = event.target.closest('[data-endpoint]');
            if (!button) return;
            const endpoint = ENDPOINTS.find((item) => item.example === button.dataset.endpoint);
            runRequest(button.dataset.method, button.dataset.endpoint, button, endpoint);
        });
    }

    function runRequest(method, path, button, endpoint) {
        const output = document.getElementById('console-output');
        if (!output) return;

        const originalText = button ? button.textContent : '';
        if (button) {
            button.disabled = true;
            button.textContent = '...';
        }

        const header = [method + ' ' + window.App.api.BASE_URL + path];
        if (endpoint && endpoint.body) {
            header.push('Cuerpo enviado:', JSON.stringify(endpoint.body, null, 2), '');
        } else if (endpoint && endpoint.note) {
            header.push(endpoint.note, '');
        }
        output.textContent = header.join('\n') + 'Ejecutando peticion...';

        const startedAt = performance.now();
        const payload = endpoint ? endpoint.body : undefined;

        window.App.api
            .raw(method, path, payload)
            .then(function (data) {
                const elapsed = Math.round(performance.now() - startedAt);
                output.textContent = [
                    header.join('\n'),
                    'Estado: 200 OK  (' + elapsed + ' ms)',
                    '',
                    JSON.stringify(data, null, 2)
                ].join('\n');
            })
            .catch(function (error) {
                output.textContent = [
                    header.join('\n'),
                    'Estado: ' + (error.status || 'sin respuesta') + ' ' + statusLabel(error.status),
                    '',
                    error.message
                ].join('\n');
            })
            .finally(function () {
                if (button) {
                    button.disabled = false;
                    button.textContent = originalText;
                }
            });
    }

    function statusLabel(status) {
        const labels = {
            200: 'OK',
            201: 'Created',
            400: 'Bad Request',
            404: 'Not Found',
            409: 'Conflict',
            422: 'Unprocessable Entity',
            500: 'Internal Server Error'
        };
        return labels[status] || '';
    }

    function init() {
        const baseLabel = document.getElementById('base-url-label');
        if (baseLabel) baseLabel.textContent = window.App.api.BASE_URL;

        renderTable();
        bindTable();

        const clearButton = document.getElementById('console-clear');
        if (clearButton) {
            clearButton.addEventListener('click', function () {
                const output = document.getElementById('console-output');
                if (output) {
                    output.textContent = 'Consola limpiada. Pulsa «Probar» en cualquier endpoint.';
                }
            });
        }
    }

    return { init: init, ENDPOINTS: ENDPOINTS };
})();
