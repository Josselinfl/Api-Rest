/* Capa de comunicacion con la API REST (Axios).
   Toda peticion pasa por aquí, de modo que el resto de la app nunca ve errores crudos. */
window.App = window.App || {};

window.App.api = (function () {
    'use strict';

    const { BASE_URL, REQUEST_TIMEOUT } = window.App.config;

    const client = axios.create({
        baseURL: BASE_URL,
        timeout: REQUEST_TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
    });

    /** Convierte la respuesta de error de Axios en un objeto uniforme. */
    function normalizeError(error) {
        if (error.response) {
            const { status, data } = error.response;
            return {
                status: status,
                message: extractMessage(data, status),
                fields: extractFieldErrors(data),
                raw: data
            };
        }
        if (error.code === 'ECONNABORTED') {
            return {
                status: 0,
                message: 'La peticion tardo demasiado. El servidor esta lento o no responde.',
                fields: {},
                raw: null
            };
        }
        return {
            status: 0,
            message: 'No se pudo conectar con la API. Comprueba que este levantada en ' + BASE_URL,
            fields: {},
            raw: null
        };
    }

    function extractMessage(data, status) {
        if (data && typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data && data.detail)) {
            return data.detail
                .map((item) => (item.loc ? item.loc.filter((p) => p !== 'body').join('.') + ': ' : '') + item.msg)
                .join(' | ');
        }
        if (status === 0) return 'Sin respuesta del servidor.';
        return 'La API respondio con el estado ' + status + '.';
    }

    function extractFieldErrors(data) {
        const fields = {};
        if (data && Array.isArray(data.detail)) {
            data.detail.forEach((item) => {
                const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : 'form';
                fields[field] = item.msg;
            });
        }
        return fields;
    }

    async function request(config) {
        try {
            const response = await client.request(config);
            return response.data;
        } catch (error) {
            throw normalizeError(error);
        }
    }

    /** Elimina parametros vacios: la API rechaza '' como valor de tipos no string. */
    function cleanParams(params) {
        if (!params) return undefined;

        const cleaned = {};
        Object.keys(params).forEach(function (key) {
            const value = params[key];
            if (value === '' || value === null || value === undefined) return;
            cleaned[key] = value;
        });
        return Object.keys(cleaned).length ? cleaned : undefined;
    }

    function get(path, params) {
        return request({ method: 'get', url: path, params: cleanParams(params) });
    }

    function post(path, data) {
        return request({ method: 'post', url: path, data: data });
    }

    function put(path, data) {
        return request({ method: 'put', url: path, data: data });
    }

    function patch(path, data) {
        return request({ method: 'patch', url: path, data: data });
    }

    function remove(path) {
        return request({ method: 'delete', url: path });
    }

    /** Ejecuta un metodo y un cuerpo libre (usado por la consola de la documentacion). */
    function raw(method, url, data) {
        return request({ method: method.toLowerCase(), url: url, data: data });
    }

    return {
        BASE_URL: BASE_URL,
        health: () => get('/health'),
        seed: () => post('/seed', {}),
        recipes: {
            list: (params) => get('/recipes', params),
            get: (id) => get('/recipes/' + id),
            create: (data) => post('/recipes', data),
            update: (id, data) => put('/recipes/' + id, data),
            remove: (id) => remove('/recipes/' + id)
        },
        categories: {
            list: (params) => get('/categories', params),
            get: (id) => get('/categories/' + id),
            create: (data) => post('/categories', data),
            update: (id, data) => patch('/categories/' + id, data),
            remove: (id) => remove('/categories/' + id)
        },
        ingredients: {
            list: (params) => get('/ingredients', params),
            create: (data) => post('/ingredients', data),
            update: (id, data) => patch('/ingredients/' + id, data),
            remove: (id) => remove('/ingredients/' + id)
        },
        raw: raw
    };
})();
