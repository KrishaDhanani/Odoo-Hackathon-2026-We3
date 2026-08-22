/* Shared auth + API helper used across all GlobeTrotter pages. */

const API = {

    TOKEN_KEY: "gt_token",
    USER_KEY: "gt_user",

    getToken() {
        return localStorage.getItem(API.TOKEN_KEY) || "";
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem(API.USER_KEY) || "null");
        } catch (error) {
            return null;
        }
    },

    setSession(token, user) {
        localStorage.setItem(API.TOKEN_KEY, token);
        localStorage.setItem(API.USER_KEY, JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem(API.TOKEN_KEY);
        localStorage.removeItem(API.USER_KEY);
    },

    isLoggedIn() {
        return !!API.getToken();
    },

    requireAuth() {
        if (!API.isLoggedIn()) {
            window.location.href = "index.html";
            return false;
        }
        return true;
    },

    logout() {
        API.clearSession();
        window.location.href = "index.html";
    },

    async request(path, options = {}) {

        const headers = Object.assign(
            { "Content-Type": "application/json" },
            options.headers || {}
        );

        const token = API.getToken();

        if (token) {
            headers.Authorization = "Bearer " + token;
        }

        const response = await fetch(path, Object.assign({}, options, { headers }));

        if (response.status === 401) {
            API.clearSession();
            window.location.href = "index.html";
            throw new Error("Not authenticated");
        }

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            throw new Error((data && data.message) || "Request failed");
        }

        return data;
    },

    get(path) {
        return API.request(path, { method: "GET" });
    },

    post(path, body) {
        return API.request(path, { method: "POST", body: JSON.stringify(body || {}) });
    },

    put(path, body) {
        return API.request(path, { method: "PUT", body: JSON.stringify(body || {}) });
    },

    del(path) {
        return API.request(path, { method: "DELETE" });
    }
};
