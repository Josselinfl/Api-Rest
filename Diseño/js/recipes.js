/* Modulo de recetas: explorado con filtros/paginacion, detalle y CRUD completo. */
window.App = window.App || {};

window.App.recipes = (function () {
    'use strict';

    const api = window.App.api;
    const ui = window.App.ui;
    const { escapeHtml, formatNumber } = ui;
    const { DIFFICULTY_LABELS } = window.App.config;

    const state = {
        page: 1,
        pageSize: 12,
        filters: { search: '', category_id: '', ingredient_id: '', difficulty: '' },
        editingId: null,
        catalog: { categories: [], ingredients: [] }
    };

    /* ---------------------------------------------------------------- */
    /* Explorado                                                         */
    /* ---------------------------------------------------------------- */
    async function loadRecipes() {
        ui.setLoading(true, 'recipes-spinner');
        const countLabel = document.getElementById('results-count');
        if (countLabel) countLabel.textContent = 'Cargando recetas...';

        try {
            const data = await api.recipes.list({
                page: state.page,
                page_size: state.pageSize,
                search: state.filters.search,
                category_id: state.filters.category_id,
                ingredient_id: state.filters.ingredient_id,
                difficulty: state.filters.difficulty,
                sort_by: 'id',
                order: 'asc'
            });

            renderCards(data.items);
            renderPagination(data.meta);
            updateResultsLabel(data.meta);
        } catch (error) {
            ui.toastError(error);
            renderCards([]);
            renderPagination({ total: 0, page: 1, total_pages: 0 });
            updateResultsLabel({ total: 0 });
        } finally {
            ui.setLoading(false, 'recipes-spinner');
        }
    }

    function updateResultsLabel(meta) {
        const label = document.getElementById('results-count');
        if (!label) return;
        label.textContent = meta.total
            ? formatNumber(meta.total) + ' receta(s) en ' + meta.total_pages + ' pagina(s)'
            : 'Sin resultados';
    }

    function renderCards(recipes) {
        const grid = document.getElementById('recipes-grid');
        const empty = document.getElementById('recipes-empty');
        if (!grid) return;

        if (empty) empty.hidden = recipes.length > 0;

        grid.innerHTML = recipes
            .map(function (recipe) {
                const difficulty = recipe.difficulty || 'facil';
                return (
                    '<article class="card">' +
                    '<div class="card__top">' +
                    '<span class="card__category">' + escapeHtml(recipe.category_name) + '</span>' +
                    '<span class="card__difficulty difficulty--' + difficulty + '">' +
                    escapeHtml(DIFFICULTY_LABELS[difficulty] || difficulty) +
                    '</span>' +
                    '</div>' +
                    '<div class="card__body">' +
                    '<h3 class="card__title">' + escapeHtml(recipe.title) + '</h3>' +
                    '<div class="card__meta">' +
                    '<span>' + formatNumber(recipe.servings) + ' raciones</span>' +
                    '<span>' + formatNumber(recipe.total_minutes) + ' min</span>' +
                    '<span>' + formatNumber(recipe.ingredient_count) + ' ingredientes</span>' +
                    '</div>' +
                    '</div>' +
                    '<div class="card__actions">' +
                    '<button class="btn btn--icon" type="button" data-detail="' + recipe.id + '">Ver receta</button>' +
                    '<button class="btn btn--icon" type="button" data-edit="' + recipe.id + '">Editar</button>' +
                    '<button class="btn btn--icon is-danger" type="button" data-delete="' + recipe.id + '">Borrar</button>' +
                    '</div>' +
                    '</article>'
                );
            })
            .join('');
    }

    function renderPagination(meta) {
        const container = document.getElementById('recipes-pagination');
        if (!container) return;

        if (!meta.total_pages || meta.total_pages <= 1) {
            container.innerHTML = '';
            return;
        }

        const current = meta.page;
        const total = meta.total_pages;
        const buttons = [];

        buttons.push(
            '<button type="button" data-page="' + (current - 1) + '"' +
            (current === 1 ? ' disabled' : '') + '>Anterior</button>'
        );

        for (let page = 1; page <= total; page += 1) {
            if (total > 7 && page !== 1 && page !== total && Math.abs(page - current) > 1) {
                if (Math.abs(page - current) === 2) buttons.push('<span aria-hidden="true">...</span>');
                continue;
            }
            buttons.push(
                '<button type="button" data-page="' + page + '"' +
                (page === current ? ' class="is-active" aria-current="page"' : '') + '>' + page + '</button>'
            );
        }

        buttons.push(
            '<button type="button" data-page="' + (current + 1) + '"' +
            (current === total ? ' disabled' : '') + '>Siguiente</button>'
        );

        container.innerHTML = buttons.join('');
    }

    async function showDetail(recipeId) {
        try {
            const recipe = await api.recipes.get(recipeId);
            const rows = recipe.ingredients
                .map(function (line) {
                    return (
                        '<tr>' +
                        '<td>' + escapeHtml(line.ingredient_name) + '</td>' +
                        '<td>' + formatNumber(line.quantity) + ' ' + escapeHtml(line.unit) + '</td>' +
                        '<td>' + escapeHtml(line.note || '-') + '</td>' +
                        '</tr>'
                    );
                })
                .join('');

            const html =
                '<dl class="detail-grid">' +
                '<div><dt>Categoria</dt><dd>' + escapeHtml(recipe.category_name) + '</dd></div>' +
                '<div><dt>Dificultad</dt><dd>' +
                escapeHtml(DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty) + '</dd></div>' +
                '<div><dt>Raciones</dt><dd>' + formatNumber(recipe.servings) + '</dd></div>' +
                '<div><dt>Tiempo total</dt><dd>' + formatNumber(recipe.total_minutes) + ' min</dd></div>' +
                '</dl>' +
                (recipe.description ? '<p class="detail-description">' + escapeHtml(recipe.description) + '</p>' : '') +
                '<h4>Ingredientes</h4>' +
                '<table class="ingredient-table">' +
                '<thead><tr><th>Ingrediente</th><th>Cantidad</th><th>Nota</th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
                '</table>';

            ui.openModal('detail-modal', html);
        } catch (error) {
            ui.toastError(error);
        }
    }

    /* ---------------------------------------------------------------- */
    /* Formulario CRUD                                                   */
    /* ---------------------------------------------------------------- */
    function addIngredientRow(line) {
        const container = document.getElementById('recipe-ingredients-rows');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'ingredient-row';

        const options = state.catalog.ingredients
            .map(function (ingredient) {
                const selected = line && line.ingredient_id === ingredient.id ? ' selected' : '';
                return (
                    '<option value="' + ingredient.id + '"' + selected + '>' +
                    escapeHtml(ingredient.name) + ' (' + escapeHtml(ingredient.unit) + ')' +
                    '</option>'
                );
            })
            .join('');

        row.innerHTML =
            '<div class="field">' +
            '<label class="sr-only" for="ing-select-' + container.children.length + '">Ingrediente</label>' +
            '<select data-role="ingredient">' + options + '</select>' +
            '</div>' +
            '<div class="field">' +
            '<label class="sr-only" for="ing-qty-' + container.children.length + '">Cantidad</label>' +
            '<input type="number" data-role="quantity" min="0.01" step="0.01" placeholder="Cant." value="' +
            (line ? line.quantity : '') + '">' +
            '</div>' +
            '<div class="field">' +
            '<label class="sr-only" for="ing-note-' + container.children.length + '">Nota</label>' +
            '<input type="text" data-role="note" maxlength="160" placeholder="Nota (opcional)" value="' +
            escapeHtml(line && line.note ? line.note : '') + '">' +
            '</div>' +
            '<button class="btn btn--icon is-danger" type="button" data-remove-row aria-label="Quitar ingrediente">&times;</button>';

        container.appendChild(row);
    }

    function collectIngredients() {
        const rows = document.querySelectorAll('#recipe-ingredients-rows .ingredient-row');
        const payload = [];

        rows.forEach(function (row) {
            const select = row.querySelector('[data-role="ingredient"]');
            const quantity = row.querySelector('[data-role="quantity"]');
            const note = row.querySelector('[data-role="note"]');

            if (!select || !select.value) return;

            const amount = parseFloat(quantity ? quantity.value : '');
            if (!amount || amount <= 0) {
                throw new Error('Indica una cantidad mayor que 0 para «' + select.options[select.selectedIndex].text + '».');
            }

            const line = { ingredient_id: Number(select.value), quantity: amount };
            if (note && note.value.trim()) line.note = note.value.trim();
            payload.push(line);
        });

        const ids = payload.map((line) => line.ingredient_id);
        if (new Set(ids).size !== ids.length) {
            throw new Error('No repitas el mismo ingrediente dentro de una receta.');
        }

        return payload;
    }

    function resetForm() {
        const form = document.getElementById('recipe-form');
        if (form) form.reset();
        state.editingId = null;

        const rows = document.getElementById('recipe-ingredients-rows');
        if (rows) rows.innerHTML = '';

        document.getElementById('recipe-form-title').textContent = 'Nueva receta';
        document.getElementById('recipe-submit').textContent = 'Crear receta';
        document.getElementById('recipe-cancel').hidden = true;
        ui.clearFormError('recipe-form-error');
    }

    async function handleSubmit(event) {
        event.preventDefault();
        ui.clearFormError('recipe-form-error');

        const submitButton = document.getElementById('recipe-submit');
        const payload = {
            title: document.getElementById('recipe-title').value.trim(),
            description: document.getElementById('recipe-description').value.trim() || null,
            category_id: Number(document.getElementById('recipe-category').value),
            difficulty: document.getElementById('recipe-difficulty').value,
            servings: Number(document.getElementById('recipe-servings').value),
            prep_minutes: Number(document.getElementById('recipe-prep').value),
            cook_minutes: Number(document.getElementById('recipe-cook').value)
        };

        let ingredients;
        try {
            ingredients = collectIngredients();
        } catch (error) {
            ui.showFormError('recipe-form-error', error.message);
            return;
        }

        if (!payload.title) {
            ui.showFormError('recipe-form-error', 'El titulo es obligatorio.');
            return;
        }
        if (!payload.category_id) {
            ui.showFormError('recipe-form-error', 'Selecciona una categoria.');
            return;
        }

        payload.ingredients = ingredients;

        submitButton.disabled = true;
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Guardando...';

        try {
            if (state.editingId) {
                await api.recipes.update(state.editingId, payload);
                ui.toastSuccess('Receta actualizada correctamente.');
            } else {
                await api.recipes.create(payload);
                ui.toastSuccess('Receta creada correctamente.');
            }
            resetForm();
            await refreshAll();
        } catch (error) {
            ui.showFormError('recipe-form-error', ui.normalizeMessage(error));
            ui.toastError(error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    async function startEdit(recipeId) {
        try {
            const recipe = await api.recipes.get(recipeId);
            state.editingId = recipe.id;

            document.getElementById('recipe-form-title').textContent = 'Editando #' + recipe.id;
            document.getElementById('recipe-submit').textContent = 'Guardar cambios';
            document.getElementById('recipe-cancel').hidden = false;

            document.getElementById('recipe-title').value = recipe.title;
            document.getElementById('recipe-description').value = recipe.description || '';
            document.getElementById('recipe-category').value = recipe.category_id;
            document.getElementById('recipe-difficulty').value = recipe.difficulty;
            document.getElementById('recipe-servings').value = recipe.servings;
            document.getElementById('recipe-prep').value = recipe.prep_minutes;
            document.getElementById('recipe-cook').value = recipe.cook_minutes;

            const rows = document.getElementById('recipe-ingredients-rows');
            rows.innerHTML = '';
            if (recipe.ingredients.length) {
                recipe.ingredients.forEach(addIngredientRow);
            } else {
                addIngredientRow();
            }

            ui.clearFormError('recipe-form-error');
            document.getElementById('recipe-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (error) {
            ui.toastError(error);
        }
    }

    async function remove(recipeId) {
        if (!ui.confirmDelete('¿Eliminar la receta #' + recipeId + '? Se borraran sus ingredientes asociados.')) return;

        try {
            const result = await api.recipes.remove(recipeId);
            ui.toastSuccess(result.detail);
            if (state.editingId === recipeId) resetForm();
            await refreshAll();
        } catch (error) {
            ui.toastError(error);
        }
    }

    /* ---------------------------------------------------------------- */
    /* Tabla de gestion                                                  */
    /* ---------------------------------------------------------------- */
    async function loadManageTable() {
        const tbody = document.getElementById('manage-body');
        const empty = document.getElementById('manage-empty');
        const badge = document.getElementById('manage-count');
        if (!tbody) return;

        try {
            const data = await api.recipes.list({ page: 1, page_size: 100, sort_by: 'id', order: 'desc' });
            if (badge) badge.textContent = formatNumber(data.meta.total);
            if (empty) empty.hidden = data.items.length > 0;

            tbody.innerHTML = data.items
                .map(function (recipe) {
                    return (
                        '<tr>' +
                        '<td>' + recipe.id + '</td>' +
                        '<td><strong>' + escapeHtml(recipe.title) + '</strong></td>' +
                        '<td>' + escapeHtml(recipe.category_name) + '</td>' +
                        '<td>' + recipe.ingredient_count + '</td>' +
                        '<td class="row-actions">' +
                        '<button class="btn btn--icon" type="button" data-edit="' + recipe.id + '">Editar</button> ' +
                        '<button class="btn btn--icon" type="button" data-detail="' + recipe.id + '">Ver</button> ' +
                        '<button class="btn btn--icon is-danger" type="button" data-delete="' + recipe.id + '">Borrar</button>' +
                        '</td>' +
                        '</tr>'
                    );
                })
                .join('');
        } catch (error) {
            tbody.innerHTML = '';
            ui.toastError(error);
        }
    }

    /* ---------------------------------------------------------------- */
    /* Carga de catalogos auxiliares                                     */
    /* ---------------------------------------------------------------- */
    async function loadCatalog() {
        const [categories, ingredients] = await Promise.all([
            api.categories.list({ page: 1, page_size: 100 }),
            api.ingredients.list({ page: 1, page_size: 100 })
        ]);

        state.catalog.categories = categories.items;
        state.catalog.ingredients = ingredients.items;

        fillSelect(
            'filter-category',
            state.catalog.categories.map((item) => ({ value: item.id, label: item.name })),
            'Todas'
        );
        fillSelect(
            'filter-ingredient',
            state.catalog.ingredients.map((item) => ({ value: item.id, label: item.name })),
            'Todos'
        );
        fillSelect(
            'recipe-category',
            state.catalog.categories.map((item) => ({ value: item.id, label: item.name })),
            null
        );
    }

    function fillSelect(selectId, options, emptyLabel) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML =
            (emptyLabel ? '<option value="">' + escapeHtml(emptyLabel) + '</option>' : '') +
            options
                .map(function (option) {
                    return '<option value="' + option.value + '">' + escapeHtml(option.label) + '</option>';
                })
                .join('');
    }

    async function refreshAll() {
        try {
            await loadCatalog();
            await Promise.all([loadRecipes(), loadManageTable()]);
            if (window.App.catalog) await window.App.catalog.refresh();
        } catch (error) {
            ui.toastError(error);
        }
    }

    /* ---------------------------------------------------------------- */
    /* Eventos                                                          */
    /* ---------------------------------------------------------------- */
    function bindEvents() {
        const grid = document.getElementById('recipes-grid');
        if (grid) {
            grid.addEventListener('click', function (event) {
                const detail = event.target.closest('[data-detail]');
                if (detail) showDetail(detail.dataset.detail);

                const edit = event.target.closest('[data-edit]');
                if (edit) startEdit(edit.dataset.edit);

                const del = event.target.closest('[data-delete]');
                if (del) remove(del.dataset.delete);
            });
        }

        const manageBody = document.getElementById('manage-body');
        if (manageBody) {
            manageBody.addEventListener('click', function (event) {
                const edit = event.target.closest('[data-edit]');
                if (edit) startEdit(edit.dataset.edit);

                const detail = event.target.closest('[data-detail]');
                if (detail) showDetail(detail.dataset.detail);

                const del = event.target.closest('[data-delete]');
                if (del) remove(del.dataset.delete);
            });
        }

        const pagination = document.getElementById('recipes-pagination');
        if (pagination) {
            pagination.addEventListener('click', function (event) {
                const button = event.target.closest('[data-page]');
                if (!button || button.disabled) return;
                state.page = Number(button.dataset.page);
                loadRecipes();
            });
        }

        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.addEventListener('submit', function (event) {
                event.preventDefault();
                const data = new FormData(filtersForm);
                state.filters = {
                    search: (data.get('search') || '').toString().trim(),
                    category_id: data.get('category_id') || '',
                    ingredient_id: data.get('ingredient_id') || '',
                    difficulty: data.get('difficulty') || ''
                };
                state.pageSize = Number(data.get('page_size')) || 12;
                state.page = 1;
                loadRecipes();
            });

            filtersForm.addEventListener('reset', function () {
                window.setTimeout(function () {
                    state.filters = { search: '', category_id: '', ingredient_id: '', difficulty: '' };
                    state.pageSize = 12;
                    state.page = 1;
                    loadRecipes();
                }, 0);
            });
        }

        const form = document.getElementById('recipe-form');
        if (form) form.addEventListener('submit', handleSubmit);

        const cancel = document.getElementById('recipe-cancel');
        if (cancel) cancel.addEventListener('click', resetForm);

        const addButton = document.getElementById('add-ingredient-row');
        if (addButton) {
            addButton.addEventListener('click', function () {
                if (!state.catalog.ingredients.length) {
                    ui.showFormError('recipe-form-error', 'Primero crea al menos un ingrediente.');
                    return;
                }
                addIngredientRow();
            });
        }

        const rows = document.getElementById('recipe-ingredients-rows');
        if (rows) {
            rows.addEventListener('click', function (event) {
                if (!event.target.closest('[data-remove-row]')) return;
                event.target.closest('.ingredient-row').remove();
            });
        }
    }

    async function init() {
        bindEvents();
        await refreshAll();
    }

    return {
        init: init,
        refreshAll: refreshAll,
        state: state
    };
})();
