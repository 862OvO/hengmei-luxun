import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

import {
    validateNickname,
    translateAuthError
} from "./auth-utils.js";

const profileMessage =
    document.querySelector("#profile-message");

const profileLoading =
    document.querySelector("#profile-loading");

const profileContent =
    document.querySelector("#profile-content");

const profileNickname =
    document.querySelector("#profile-nickname");

const profileEmail =
    document.querySelector("#profile-email");

const profileEmailStatus =
    document.querySelector(
        "#profile-email-status"
    );

const profileCreatedAt =
    document.querySelector("#profile-created-at");

const profileRole =
    document.querySelector("#profile-role");

const profileAccountStatus =
    document.querySelector("#profile-account-status");

const profileMonogram =
    document.querySelector("#profile-monogram");

const profileIdentityNickname =
    document.querySelector("#profile-identity-nickname");

const profileAccountType =
    document.querySelector("#profile-account-type");

const profileFavoriteCount =
    document.querySelector("#profile-favorite-count");

const profileMessageCount =
    document.querySelector("#profile-message-count");

const profileAdminLink =
    document.querySelector("#profile-admin-link");

const nicknameInput =
    document.querySelector(
        "#profile-nickname-input"
    );

const nicknameError =
    document.querySelector(
        "#profile-nickname-error"
    );

const profileForm =
    document.querySelector("#profile-form");

const profileSubmit =
    document.querySelector("#profile-submit");

const logoutButton =
    document.querySelector("#profile-logout");

let currentUser = null;
let currentNickname = "";

function showProfileMessage(
    message,
    type = "info"
) {
    if (!profileMessage) {
        return;
    }

    profileMessage.textContent = message;
    profileMessage.hidden = false;
    profileMessage.className = "auth-message";

    if (type === "success") {
        profileMessage.classList.add(
            "is-success"
        );
    }

    if (type === "error") {
        profileMessage.classList.add(
            "is-error"
        );
    }
}

function hideProfileMessage() {
    if (!profileMessage) {
        return;
    }

    profileMessage.hidden = true;
    profileMessage.textContent = "";
    profileMessage.className = "auth-message";
}

function setProfileButtonLoading(
    isLoading,
    loadingText
) {
    if (!profileSubmit) {
        return;
    }

    if (!profileSubmit.dataset.defaultText) {
        profileSubmit.dataset.defaultText =
            profileSubmit.textContent.trim();
    }

    profileSubmit.disabled = isLoading;

    profileSubmit.textContent = isLoading
        ? loadingText
        : profileSubmit.dataset.defaultText;
}

function formatDate(value) {
    if (!value) {
        return "暂无记录";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "暂无记录";
    }

    return new Intl.DateTimeFormat(
        "zh-CN",
        {
            dateStyle: "long",
            timeStyle: "short"
        }
    ).format(date);
}

function redirectToLogin() {
    window.sessionStorage.setItem(
        "authReturnPath",
        "profile.html"
    );

    window.location.assign(
        "auth.html?returnTo=profile.html"
    );
}

function setCount(element, result) {
    if (!element) return;
    element.textContent =
        result.status === "fulfilled" && !result.value.error
            ? String(result.value.count ?? 0)
            : "—";
}

async function loadActivitySummary(userId) {
    const results = await Promise.allSettled([
        supabaseClient
            .from("favorites")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
        supabaseClient
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "visible")
    ]);

    setCount(profileFavoriteCount, results[0]);
    setCount(profileMessageCount, results[1]);
}

async function loadProfile() {
    if (!isSupabaseConfigured()) {
        profileLoading.hidden = true;

        showProfileMessage(
            "登录服务配置尚未完成。",
            "error"
        );

        return;
    }

    profileContent.hidden = true;

    try {
        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        currentUser =
            sessionData.session?.user ?? null;

        if (!currentUser) {
            redirectToLogin();
            return;
        }

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select(
                "nickname, role, account_status, created_at, updated_at"
            )
            .eq("id", currentUser.id)
            .single();

        if (profileError) {
            throw profileError;
        }

        currentNickname = profile.nickname;

        profileNickname.textContent =
            profile.nickname;

        profileIdentityNickname.textContent =
            profile.nickname;

        profileMonogram.textContent =
            [...profile.nickname][0] ?? "横";

        profileEmail.textContent =
            currentUser.email || "暂无邮箱";

        profileCreatedAt.textContent =
            formatDate(profile.created_at);

        const isAdmin = profile.role === "admin";
        profileRole.textContent = isAdmin
            ? "展馆管理员"
            : "注册观众";
        profileAccountType.textContent = isAdmin
            ? "数字展馆内容管理员"
            : "数字展馆注册观众";
        profileAdminLink.hidden = !isAdmin;

        const statusLabels = {
            active: "正常使用",
            banned: "访问受限",
            pending_deletion: "等待注销"
        };
        profileAccountStatus.textContent =
            statusLabels[profile.account_status] ?? "状态未知";
        profileAccountStatus.dataset.status =
            profile.account_status ?? "unknown";

        nicknameInput.value =
            profile.nickname;

        const isVerified =
            Boolean(
                currentUser.email_confirmed_at
            );

        profileEmailStatus.textContent =
            isVerified ? "已验证" : "未验证";

        profileEmailStatus.classList.remove(
            "is-verified",
            "is-unverified"
        );

        profileEmailStatus.classList.add(
            isVerified
                ? "is-verified"
                : "is-unverified"
        );

        profileLoading.hidden = true;
        profileContent.hidden = false;

        loadActivitySummary(currentUser.id).catch((error) => {
            console.warn("Profile summary failed:", error?.message);
            profileFavoriteCount.textContent = "—";
            profileMessageCount.textContent = "—";
        });
    } catch (error) {
        console.error(
            "Profile loading failed:",
            error?.message
        );

        profileLoading.hidden = true;

        showProfileMessage(
            translateAuthError(error),
            "error"
        );
    }
}

profileForm?.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();
        hideProfileMessage();

        nicknameError.textContent = "";

        const newNickname =
            nicknameInput.value.trim();

        const result =
            validateNickname(newNickname);

        if (!result.valid) {
            nicknameError.textContent =
                result.message;

            nicknameInput.setAttribute(
                "aria-invalid",
                "true"
            );

            return;
        }

        nicknameInput.setAttribute(
            "aria-invalid",
            "false"
        );

        if (
            newNickname.toLowerCase() ===
            currentNickname.toLowerCase()
        ) {
            showProfileMessage(
                "新昵称与当前昵称相同。",
                "error"
            );

            return;
        }

        setProfileButtonLoading(
            true,
            "正在保存……"
        );

        try {
            const {
                data: updatedProfile,
                error
            } = await supabaseClient
                .from("profiles")
                .update({
                    nickname: newNickname
                })
                .eq("id", currentUser.id)
                .select("nickname, updated_at")
                .single();

            if (error) {
                throw error;
            }

            currentNickname =
                updatedProfile.nickname;

            profileNickname.textContent =
                updatedProfile.nickname;

            profileIdentityNickname.textContent =
                updatedProfile.nickname;

            profileMonogram.textContent =
                [...updatedProfile.nickname][0] ?? "横";

            nicknameInput.value =
                updatedProfile.nickname;

            showProfileMessage(
                "昵称修改成功。",
                "success"
            );
        } catch (error) {
            console.error(
                "Profile update failed:",
                error?.message
            );

            showProfileMessage(
                translateAuthError(error),
                "error"
            );
        } finally {
            setProfileButtonLoading(
                false,
                "正在保存……"
            );
        }
    }
);

logoutButton?.addEventListener(
    "click",
    async () => {
        logoutButton.disabled = true;
        logoutButton.textContent =
            "正在退出……";

        try {
            await supabaseClient.auth.signOut();
        } finally {
            window.location.assign(
                "index.html"
            );
        }
    }
);

loadProfile();
