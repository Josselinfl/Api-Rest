/* Modulo de catalogo: CRUD de categorias (N:1) e ingredientes (N:M). */
window.App = window.App || {};

window.App.catalog = (function () {
    'use strict';

    const api = window.App.api;
    const ui = window.App.ui;
    const { escapeHtml, formatNumber } = ui;

    const state = {
        editingCategoryId: null,
        editingIngredientId: null
    };

    /* ---------------------------------------------------------------- */
    /* Categorias                                                        */
    /* ---------------------------------------------------------------- */
    function resetCategoryForm() {
        document.getElementById('category-form').reset();
        state.editingCategoryId = null;
        document.querySelector('#category-form .panel__title').textContent = 'Nueva categoria';
        document.getElementById('category-submit').textContent = 'Crear categoria';
        document.getElementById('category-cancel').hidden = true;
        ui.clearFormError('category-form-error');
    }

    async function loadCategories() {
        const list = document.getElementById('categories-list');
        const badge = document.getElementById('categories-count');
        if (!list) return;

        try {
            const data = await api.categories.list({ page: 1, page_size: 100, sort_by: 'name' });
            if (badge) badge.textContent = formatNumber(data.meta.total);

            const details = await Promise.all(
                data.items.map((category) => api.categories.get(category.id).catch(() => category))
            );

            if (!details.length) {
                list.innerHTML = '<li class="empty-state empty-state--sm">Todavia no hay categorias.</li>';
                return;
            }

            list.innerHTML = details
                .map(function (category) {
                    return (
                        '<li class="chip">' +
                        '<div class="chip__info">' +
                        '<div class="chip__name">' + escapeHtml(category.name) + '</div>' +
                        '<div class="chip__meta">#' + category.id + ' · /' + escapeHtml(category.slug) + ' · ' +
                        formatNumber(category.recipe_count || 0) + ' receta(s)</div>' +
                        '</div>' +
                        '<div class="chip__actions">' +
                        '<button class="btn btn--icon" type="button" data-edit-category="' + category.id + '">Editar</button>' +
                        '<button class="btn btn--icon is-danger" type="button" data-delete-category="' + category.id + '">Borrar</button>' +
                        '</div>' +
                        '</li>'
                    );
                })
                .join('');
        } catch (error) {
            list.innerHTML = '';
            ui.toastError(error);
        }
    }

    async function handleCategorySubmit(event) {
        event.preventDefault();
        ui.clearFormError('category-form-error');

        const payload = {
            name: document.getElementById('category-name').value.trim(),
            description: document.getElementById('category-description').value.trim() || null
        };

        if (!payload.name) {
            ui.showFormError('category-form-error', 'El nombre es obligatorio.');
            return;
        }

        const button = document.getElementById('category-submit');
        button.disabled = true;

        try {
            if (state.editingCategoryId) {
                const result = await api.categories.update(state.editingCategoryId, payload);
                ui.toastSuccess('Categoria «' + result.name + '» actualizada.');
            } else {
                await api.categories.create(payload);
                ui.toastSuccess('Categoria «' + payload.name + '» creada.');
            }
            resetCategoryForm();
            await window.App.recipes.refreshAll();
        } catch (error) {
            ui.showFormError('category-form-error', ui.normalizeMessage(error));
            ui.toastError(error);
        } finally {
            button.disabled = false;
        }
    }

    async function startEditCategory(categoryId) {
        try {
            const category = await api.categories.get(categoryId);
            state.editingCategoryId = category.id;

            document.querySelector('#category-form .panel__title').textContent = 'Editando #' + category.id;
            document.getElementById('category-submit').textContent = 'Guardar cambios';
            document.getElementById('category-cancel').hidden = false;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-description').value = category.description || '';
            ui.clearFormError('category-form-error');
        } catch (error) {
            ui.toastError(error);
        }
    }

    async function removeCategory(categoryId) {
        if (!ui.confirmDelete('¿Eliminar la categoria #' + categoryId + '?')) return;
        try {
            const result = await api.categories.remove(categoryId);
            ui.toastSuccess(result.detail);
            if (state.editingCategoryId === categoryId) resetCategoryForm();
            await window.App.recipes.refreshAll();
        } catch (error) {
            ui.toastError(error);
        }
    }

    /* ---------------------------------------------------------------- */
    /* Ingredientes                                                      */
    /* ---------------------------------------------------------------- */
    function resetIngredientForm() {
        document.getElementById('ingredient-form').reset();
        document.getElementById('ingredient-unit').value = 'g';
        state.editingIngredientId = null;
        document.querySelector('#ingredient-form .panel__title').textContent = 'Nuevo ingrediente';
        document.getElementById('ingredient-submit').textContent = 'Crear ingrediente';
        document.getElementById('ingredient-cancel').hidden = true;
        ui.clearFormError('ingredient-form-error');
    }

    async function loadIngredients() {
        const body = document.getElementById('ingredients-body');
        const badge = document.getElementById('ingredients-count');
        if (!body) return;

        try {
            const data = await api.ingredients.list({ page: 1, page_size: 100 });
            if (badge) badge.textContent = formatNumber(data.meta.total);

            body.innerHTML = data.items
                .map(function (ingredient) {
                    return (
                        '<tr>' +
                        '<td><strong>' + escapeHtml(ingredient.name) + '</strong></td>' +
                        '<td>' + escapeHtml(ingredient.unit) + '</td>' +
                        '<td>' + formatNumber(ingredient.recipe_count) + '</td>' +
                        '<td class="row-actions">' +
                        '<button class="btn btn--icon" type="button" data-edit-ingredient="' + ingredient.id + '">Editar</button> ' +
                        '<button class="btn btn--icon is-danger" type="button" data-delete-ingredient="' + ingredient.id + '">Borrar</button>' +
                        '</td>' +
                        '</tr>'
                    );
                })
                .join('');
        } catch (error) {
            body.innerHTML = '';
            ui.toastError(error);
        }
    }

    async function handleIngredientSubmit(event) {
        event.preventDefault();
        ui.clearFormError('ingredient-form-error');

        const caloriesRaw = document.getElementById('ingredient-calories').value;
        const payload = {
            name: document.getElementById('ingredient-name').value.trim(),
            unit: document.getElementById('ingredient-unit').value.trim() || 'unidad',
            calories: caloriesRaw === '' ? null : Number(caloriesRaw)
        };

        if (!payload.name) {
            ui.showFormError('ingredient-form-error', 'El nombre es obligatorio.');
            return;
        }
        if (payload.calories !== null && (isNaN(payload.calories) || payload.calories < 0)) {
            ui.showFormError('ingredient-form-error', 'Las calorías no pueden ser negativas.');
            return;
        }

        const button = document.getElementById('ingredient-submit');
        button.disabled = true;

        try {
            if (state.editingIngredientId) {
                const result = await api.ingredients.update(state.editingIngredientId, payload);
                ui.toastSuccess('Ingrediente «' + result.name + '» actualizado.');
            } else {
                await api.ingredients.create(payload);
                ui.toastSuccess('Ingrediente «' + payload.name + '» creado.');
            }
            resetIngredientForm();
            await window.App.recipes.refreshAll();
        } catch (error) {
            ui.showFormError('ingredient-form-error', ui.normalizeMessage(error));
            ui.toastError(error);
        } finally {
            button.disabled = false;
        }
    }

    async function startEditIngredient(ingredientId) {
        try {
            const data = await api.ingredients.list({ page: 1, page_size: 100 });
            const ingredient = data.items.find((item) => item.id === ingredientId);
            if (!ingredient) throw { message: 'Ingrediente no encontrado.' };

            state.editingIngredientId = ingredient.id;
            document.querySelector('#ingredient-form .panel__title').textContent = 'Editando #' + ingredient.id;
            document.getElementById('ingredient-submit').textContent = 'Guardar cambios';
            document.getElementById('ingredient-cancel').hidden = false;
            document.getElementById('ingredient-name').value = ingredient.name;
            document.getElementById('ingredient-unit').value = ingredient.unit;
            document.getElementById('ingredient-calories').value =
                ingredient.calories === null ? '' : ingredient.calories;
            ui.clearFormError('ingredient-form-error');
        } catch (error) {
            ui.toastError(error);
        }
    }

    async function removeIngredient(ingredientId) {
        if (!ui.confirmDelete('¿Eliminar el ingrediente #' + ingredientId + '?')) return;
        try {
            const result = await api.ingredients.remove(ingredientId);
            ui.toastSuccess(result.detail);
            if (state.editingIngredientId === ingredientId) resetIngredientForm();
            await window.App.recipes.refreshAll();
        } catch (error) {
            ui.toastError(error);
        }
    }

    /* ---------------------------------------------------------------- */
    /* Eventos                                                          */
    /* ---------------------------------------------------------------- */
    function bindEvents() {
        const list = document.getElementById('categories-list');
        if (list) {
            list.addEventListener('click', function (event) {
                const edit = event.target.closest('[data-edit-category]');
                if (edit) startEditCategory(edit.dataset.editCategory);

                const del = event.target.closest('[data-delete-category]');
                if (del) removeCategory(del.dataset.deleteCategory);
            });
        }

        const body = document.getElementById('ingredients-body');
        if (body) {
            body.addEventListener('click', function (event) {
                const edit = event.target.closest('[data-edit-ingredient]');
                if (edit) startEditIngredient(edit.dataset.editIngredient);

                const del = event.target.closest('[data-delete-ingredient]');
                if (del) removeIngredient(del.dataset.deleteIngredient);
            });
        }

        const categoryForm = document.getElementById('category-form');
        if (categoryForm) categoryForm.addEventListener('submit', handleCategorySubmit);

        const categoryCancel = document.getElementById('category-cancel');
        if (categoryCancel) categoryCancel.addEventListener('click', resetCategoryForm);

        const ingredientForm = document.getElementById('ingredient-form');
        if (ingredientForm) ingredientForm.addEventListener('submit', handleIngredientSubmit);

        const ingredientCancel = document.getElementById('ingredient-cancel');
        if (ingredientCancel) ingredientCancel.addEventListener('click', resetIngredientForm);
    }

    async function refresh() {
        await Promise.all([loadCategories(), loadIngredients()]);
    }

    async function init() {
        bindEvents();
        await refresh();
    }

    return { init: init, refresh: refresh };
})();
