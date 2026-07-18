const NICKNAME_PATTERN = /^[\u4e00-\u9fffA-Za-z0-9_]{2,20}$/u;
const PASSWORD_HAS_LETTER = /[A-Za-z]/;
const PASSWORD_HAS_NUMBER = /\d/;

const ALLOWED_RETURN_PAGES = new Set([
    "index.html",
    "biography.html",
    "works.html",
    "relations.html",
    "quotes.html",
    "history.html",
    "articles.html",
    "gallery.html",
    "auth.html",
    "profile.html"
]);

export function validateNickname(nickname) {
    const value = String(nickname ?? "").trim();

    if (!value) {
        return {
            valid: false,
            message: "请输入昵称。"
        };
    }

    if (value.length < 2 || value.length > 20) {
        return {
            valid: false,
            message: "昵称长度必须为 2～20 个字符。"
        };
    }

    if (!NICKNAME_PATTERN.test(value)) {
        return {
            valid: false,
            message: "昵称只能包含中文、英文字母、数字和下划线。"
        };
    }

    return {
        valid: true,
        message: ""
    };
}

export function validatePassword(password) {
    const value = String(password ?? "");

    if (!value) {
        return {
            valid: false,
            message: "请输入密码。"
        };
    }

    if (value.length < 8) {
        return {
            valid: false,
            message: "密码至少需要 8 位。"
        };
    }

    if (
        !PASSWORD_HAS_LETTER.test(value) ||
        !PASSWORD_HAS_NUMBER.test(value)
    ) {
        return {
            valid: false,
            message: "密码必须同时包含英文字母和数字。"
        };
    }

    return {
        valid: true,
        message: ""
    };
}

export function validateEmail(email) {
    const value = String(email ?? "").trim();

    if (!value) {
        return {
            valid: false,
            message: "请输入邮箱地址。"
        };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(value)) {
        return {
            valid: false,
            message: "邮箱格式不正确。"
        };
    }

    return {
        valid: true,
        message: ""
    };
}

export function safeReturnPath(value) {
    const defaultPath = "index.html";

    if (typeof value !== "string") {
        return defaultPath;
    }

    const path = value.trim();

    if (
        !path ||
        path.startsWith("/") ||
        path.startsWith("\\") ||
        path.includes("://") ||
        path.toLowerCase().startsWith("javascript:") ||
        path.toLowerCase().startsWith("data:")
    ) {
        return defaultPath;
    }

    const pageName = path.split(/[?#]/)[0];

    if (!ALLOWED_RETURN_PAGES.has(pageName)) {
        return defaultPath;
    }

    return path;
}

export function translateAuthError(error) {
    const message = String(error?.message ?? "").toLowerCase();

    if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials")
    ) {
        return "邮箱或密码不正确。";
    }

    if (
        message.includes("email not confirmed") ||
        message.includes("email_not_confirmed")
    ) {
        return "请先完成邮箱验证。";
    }

    if (
        message.includes("user already registered") ||
        message.includes("already been registered")
    ) {
        return "该邮箱已经注册，请直接登录。";
    }

    if (
        message.includes("duplicate key") ||
        message.includes("nickname")
    ) {
        return "该昵称已被使用，请更换一个昵称。";
    }

    if (
        message.includes("rate limit") ||
        message.includes("too many requests")
    ) {
        return "请求过于频繁，请稍后再试。";
    }

    if (
        message.includes("network") ||
        message.includes("failed to fetch")
    ) {
        return "网络连接失败，请检查网络后重试。";
    }

	if (message.includes("database error saving new user")) {
    return "昵称可能已被使用，或注册资料不符合要求。";
}
    return "操作未能完成，请稍后重试。";
}