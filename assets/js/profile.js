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
                "nickname, created_at, updated_at"
            )
            .eq("id", currentUser.id)
            .single();

        if (profileError) {
            throw profileError;
        }

        currentNickname = profile.nickname;

        profileNickname.textContent =
            profile.nickname;

        profileEmail.textContent =
            currentUser.email || "暂无邮箱";

        profileCreatedAt.textContent =
            formatDate(profile.created_at);

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