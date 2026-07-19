import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

import {
    safeReturnPath
} from "./auth-utils.js";

import "./header-search.js";

const AUTH_ACTIONS_SELECTOR =
    "[data-auth-actions]";

function getAuthContainers() {
    return document.querySelectorAll(
        AUTH_ACTIONS_SELECTOR
    );
}

function getCurrentPagePath() {
    const pathname =
        window.location.pathname;

    const pageName =
        pathname.split("/").pop();

    return safeReturnPath(
        pageName || "index.html"
    );
}

export function saveReturnPath(path) {
    const safePath =
        safeReturnPath(path);

    window.sessionStorage.setItem(
        "authReturnPath",
        safePath
    );

    return safePath;
}

export function consumeReturnPath() {
    const storedPath =
        window.sessionStorage.getItem(
            "authReturnPath"
        );

    window.sessionStorage.removeItem(
        "authReturnPath"
    );

    return safeReturnPath(
        storedPath || "index.html"
    );
}

function createLoginLink() {
    const returnPath =
        saveReturnPath(
            getCurrentPagePath()
        );

    const link =
        document.createElement("a");

    link.className = "account-link";

    link.href =
        `auth.html?returnTo=${
            encodeURIComponent(returnPath)
        }`;

    link.textContent = "登录 / 注册";

    return link;
}

function createProfileLink() {
    const link =
        document.createElement("a");

    link.className = "account-link";
    link.href = "profile.html";
    link.textContent = "个人中心";

    return link;
}

function createFavoritesLink() {
    const link =
        document.createElement("a");

    link.className = "account-link";
    link.href = "favorites.html";
    link.textContent = "我的收藏";

    return link;
}

function createDivider() {
    const divider =
        document.createElement("span");

    divider.className =
        "account-divider";

    divider.setAttribute(
        "aria-hidden",
        "true"
    );

    return divider;
}

function createLogoutButton() {
    const button =
        document.createElement("button");

    button.className =
        "account-button";

    button.type = "button";
    button.textContent = "退出";

    button.addEventListener(
        "click",
        async () => {
            button.disabled = true;
            button.textContent =
                "退出中……";

            try {
                const { error } =
                    await supabaseClient.auth
                        .signOut();

                if (error) {
                    throw error;
                }

                window.location.reload();
            } catch (error) {
                console.error(
                    "Sign out failed:",
                    error?.message
                );

                button.disabled = false;
                button.textContent =
                    "退出失败";
            }
        }
    );

    return button;
}

function renderSignedOut() {
    getAuthContainers().forEach(
        (container) => {
            container.replaceChildren(
                createLoginLink()
            );
        }
    );
}

function renderSignedIn() {
    getAuthContainers().forEach(
        (container) => {
            container.replaceChildren(
                createProfileLink(),
                createDivider(),
                createFavoritesLink(),
                createDivider(),
                createLogoutButton()
            );
        }
    );
}

function renderUnavailable() {
    getAuthContainers().forEach(
        (container) => {
            const status =
                document.createElement("span");

            status.className =
                "account-status";

            status.textContent =
                "登录服务暂不可用";

            container.replaceChildren(
                status
            );
        }
    );
}

function renderSession(session) {
    if (session?.user) {
        renderSignedIn();
        return;
    }

    renderSignedOut();
}

export async function getCurrentUser() {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const { data, error } =
        await supabaseClient.auth
            .getSession();

    if (error) {
        throw error;
    }

    return data.session?.user ?? null;
}

export async function signOutCurrentUser() {
    if (!isSupabaseConfigured()) {
        return;
    }

    const { error } =
        await supabaseClient.auth
            .signOut();

    if (error) {
        throw error;
    }
}

export async function initializeAuthState() {
    const containers =
        getAuthContainers();

    if (containers.length === 0) {
        return;
    }

    if (!isSupabaseConfigured()) {
        renderUnavailable();
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.auth
                .getSession();

        if (error) {
            throw error;
        }

        renderSession(data.session);

        supabaseClient.auth
            .onAuthStateChange(
                (_event, session) => {
                    renderSession(session);
                }
            );
    } catch (error) {
        console.error(
            "Authentication state failed:",
            error?.message
        );

        renderUnavailable();
    }
}

initializeAuthState();