import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

import {
    validateEmail,
    validateNickname,
    validatePassword,
    safeReturnPath,
    translateAuthError
} from "./auth-utils.js";

const authTabs = document.querySelector(".auth-tabs");
const tabButtons = document.querySelectorAll("[data-auth-tab]");
const formPanels = document.querySelectorAll("[data-auth-panel]");
const authMessage = document.querySelector("#auth-message");
const PRODUCTION_AUTH_URL =
    "https://hengmei-luxun.vercel.app/auth.html";

function showMessage(message, type = "info") {
    if (!authMessage) {
        return;
    }

    authMessage.textContent = message;
    authMessage.hidden = false;
    authMessage.className = "auth-message";

    if (type === "success") {
        authMessage.classList.add("is-success");
    }

    if (type === "error") {
        authMessage.classList.add("is-error");
    }
}

function hideMessage() {
    if (!authMessage) {
        return;
    }

    authMessage.hidden = true;
    authMessage.textContent = "";
    authMessage.className = "auth-message";
}

function setButtonLoading(
    button,
    isLoading,
    loadingText
) {
    if (!button) {
        return;
    }

    if (!button.dataset.defaultText) {
        button.dataset.defaultText =
            button.textContent.trim();
    }

    button.disabled = isLoading;

    button.textContent = isLoading
        ? loadingText
        : button.dataset.defaultText;
}

function getLoginReturnPath() {
    const queryParameters =
        new URLSearchParams(window.location.search);

    const queryReturnPath =
        queryParameters.get("returnTo");

    const storedReturnPath =
        window.sessionStorage.getItem(
            "authReturnPath"
        );

    window.sessionStorage.removeItem(
        "authReturnPath"
    );

    return safeReturnPath(
        queryReturnPath ||
        storedReturnPath ||
        "index.html"
    );
}

function showPanel(panelName) {
    formPanels.forEach((panel) => {
        const isActive = panel.dataset.authPanel === panelName;

        panel.hidden = !isActive;
        panel.classList.toggle("active", isActive);
    });

    const showTabs =
        panelName === "login" ||
        panelName === "register";

    if (authTabs) {
        authTabs.hidden = !showTabs;
    }

    tabButtons.forEach((button) => {
        const isActive = button.dataset.authTab === panelName;

        button.classList.toggle("active", isActive);
        button.setAttribute(
            "aria-selected",
            String(isActive)
        );
    });

    hideMessage();
}

function setFieldError(inputId, errorId, message) {
    const input = document.querySelector(`#${inputId}`);
    const error = document.querySelector(`#${errorId}`);

    if (input) {
        input.setAttribute(
            "aria-invalid",
            message ? "true" : "false"
        );
    }

    if (error) {
        error.textContent = message;
    }
}

function clearFormErrors(form) {
    form.querySelectorAll(".form-error").forEach((element) => {
        element.textContent = "";
    });

    form.querySelectorAll("[aria-invalid]").forEach((element) => {
        element.setAttribute("aria-invalid", "false");
    });
}

function initializeTabs() {
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            showPanel(button.dataset.authTab);
        });
    });
}

function initializePasswordToggles() {
    const toggleButtons =
        document.querySelectorAll("[data-password-toggle]");

    toggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const inputId = button.dataset.passwordToggle;
            const input = document.querySelector(`#${inputId}`);

            if (!input) {
                return;
            }

            const isPassword = input.type === "password";

            input.type = isPassword ? "text" : "password";
            button.textContent = isPassword ? "隐藏" : "显示";

            button.setAttribute(
                "aria-label",
                isPassword ? "隐藏密码" : "显示密码"
            );
        });
    });
}

function initializePanelNavigation() {
    const forgotButton =
        document.querySelector("#show-forgot-password");

    const backButton =
        document.querySelector("#back-to-login");

    forgotButton?.addEventListener("click", () => {
        const loginEmail =
            document.querySelector("#login-email");

        const forgotEmail =
            document.querySelector("#forgot-email");

        if (loginEmail && forgotEmail) {
            forgotEmail.value = loginEmail.value;
        }

        showPanel("forgot-password");
    });

    backButton?.addEventListener("click", () => {
        showPanel("login");
    });
}

function initializeLoginForm() {
    const form = document.querySelector("#login-form");

    const submitButton =
        document.querySelector("#login-submit");
	
	const resendButton =
    document.querySelector("#resend-verification");

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearFormErrors(form);
        hideMessage();

        const emailInput =
            document.querySelector("#login-email");

        const passwordInput =
            document.querySelector("#login-password");

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const emailResult = validateEmail(email);
        const passwordResult =
            validatePassword(password);

        setFieldError(
            "login-email",
            "login-email-error",
            emailResult.message
        );

        setFieldError(
            "login-password",
            "login-password-error",
            passwordResult.message
        );

        if (!emailResult.valid || !passwordResult.valid) {
            showMessage(
                "请检查表单中标出的内容。",
                "error"
            );
            return;
        }

        if (!isSupabaseConfigured()) {
            showMessage(
                "登录服务配置尚未完成。",
                "error"
            );
            return;
        }

        setButtonLoading(
            submitButton,
            true,
            "正在登录……"
        );

        try {
            const { data, error } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email,
                        password
                    });

            if (error) {
                throw error;
            }

            if (!data.user?.email_confirmed_at) {
                await supabaseClient.auth.signOut();

                throw new Error(
                    "Email not confirmed"
                );
            }
	
			if (resendButton) {
    			resendButton.hidden = true;
			}

            showMessage(
                "登录成功，正在返回原页面……",
                "success"
            );

            const returnPath =
                getLoginReturnPath();

            window.setTimeout(() => {
                window.location.assign(returnPath);
            }, 600);
        } catch (error) {
    console.error(
        "Login failed:",
        error?.message
    );

    const errorMessage =
        String(error?.message ?? "")
            .toLowerCase();

    const emailNotConfirmed =
        errorMessage.includes(
            "email not confirmed"
        ) ||
        errorMessage.includes(
            "email_not_confirmed"
        );

    if (resendButton) {
        resendButton.hidden =
            !emailNotConfirmed;
    }

    showMessage(
        translateAuthError(error),
        "error"
    );
} finally {
            setButtonLoading(
                submitButton,
                false,
                "正在登录……"
            );
        }
    });
}

function initializeRegisterForm() {
    const form = document.querySelector("#register-form");
    const submitButton =
        document.querySelector("#register-submit");

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearFormErrors(form);
        hideMessage();

        const nicknameInput =
            document.querySelector("#register-nickname");

        const emailInput =
            document.querySelector("#register-email");

        const passwordInput =
            document.querySelector("#register-password");

        const confirmInput =
            document.querySelector(
                "#register-password-confirm"
            );

        const agreementInput =
            document.querySelector(
                "#register-agreement"
            );

        const nickname = nicknameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = confirmInput.value;
        const agreement = agreementInput.checked;

        const nicknameResult =
            validateNickname(nickname);

        const emailResult =
            validateEmail(email);

        const passwordResult =
            validatePassword(password);

        setFieldError(
            "register-nickname",
            "register-nickname-error",
            nicknameResult.message
        );

        setFieldError(
            "register-email",
            "register-email-error",
            emailResult.message
        );

        setFieldError(
            "register-password",
            "register-password-error",
            passwordResult.message
        );

        const confirmMessage =
            password === passwordConfirm
                ? ""
                : "两次输入的密码不一致。";

        setFieldError(
            "register-password-confirm",
            "register-password-confirm-error",
            confirmMessage
        );

        const agreementError =
            document.querySelector(
                "#register-agreement-error"
            );

        if (agreementError) {
            agreementError.textContent = agreement
                ? ""
                : "请先勾选同意网站使用说明。";
        }

        const formIsValid =
            nicknameResult.valid &&
            emailResult.valid &&
            passwordResult.valid &&
            password === passwordConfirm &&
            agreement;

        if (!formIsValid) {
            showMessage(
                "请检查表单中标出的内容。",
                "error"
            );
            return;
        }

        if (!isSupabaseConfigured()) {
            showMessage(
                "登录服务配置尚未完成。",
                "error"
            );
            return;
        }

        setButtonLoading(
            submitButton,
            true,
            "正在注册……"
        );

        try {
            const { error } =
                await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nickname
                        },
                        emailRedirectTo:
                            PRODUCTION_AUTH_URL
                    }
                });

            if (error) {
                throw error;
            }

            form.reset();

            showMessage(
                "注册申请已提交，请前往邮箱完成验证。验证完成后，请返回本页面手动登录。",
                "success"
            );
        } catch (error) {
            console.error(
                "Registration failed:",
                error?.message
            );

            showMessage(
                translateAuthError(error),
                "error"
            );
        } finally {
            setButtonLoading(
                submitButton,
                false,
                "正在注册……"
            );
        }
    });
}

function initializeForgotPasswordForm() {
    const form =
        document.querySelector(
            "#forgot-password-form"
        );

    const submitButton =
        document.querySelector(
            "#forgot-password-submit"
        );

    form?.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            clearFormErrors(form);
            hideMessage();

            const emailInput =
                document.querySelector(
                    "#forgot-email"
                );

            const email =
                emailInput.value.trim();

            const result =
                validateEmail(email);

            setFieldError(
                "forgot-email",
                "forgot-email-error",
                result.message
            );

            if (!result.valid) {
                showMessage(
                    "请填写正确的邮箱地址。",
                    "error"
                );
                return;
            }

            if (!isSupabaseConfigured()) {
                showMessage(
                    "登录服务配置尚未完成。",
                    "error"
                );
                return;
            }

            setButtonLoading(
                submitButton,
                true,
                "正在发送……"
            );

            try {
                const { error } =
                    await supabaseClient.auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    PRODUCTION_AUTH_URL
                            }
                        );

                if (error) {
                    throw error;
                }

                form.reset();

                showMessage(
                    "密码重置邮件已发送。请检查邮箱并点击邮件中的链接。",
                    "success"
                );
            } catch (error) {
                console.error(
                    "Password reset request failed:",
                    error?.message
                );

                showMessage(
                    translateAuthError(error),
                    "error"
                );
            } finally {
                setButtonLoading(
                    submitButton,
                    false,
                    "正在发送……"
                );
            }
        }
    );
}

function initializeResetPasswordForm() {
    const form =
        document.querySelector(
            "#reset-password-form"
        );

    const submitButton =
        document.querySelector(
            "#reset-password-submit"
        );

    form?.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            clearFormErrors(form);
            hideMessage();

            const passwordInput =
                document.querySelector(
                    "#reset-password"
                );

            const confirmInput =
                document.querySelector(
                    "#reset-password-confirm"
                );

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmInput.value;

            const passwordResult =
                validatePassword(password);

            setFieldError(
                "reset-password",
                "reset-password-error",
                passwordResult.message
            );

            const confirmMessage =
                password === confirmPassword
                    ? ""
                    : "两次输入的新密码不一致。";

            setFieldError(
                "reset-password-confirm",
                "reset-password-confirm-error",
                confirmMessage
            );

            if (
                !passwordResult.valid ||
                password !== confirmPassword
            ) {
                showMessage(
                    "请检查新密码。",
                    "error"
                );
                return;
            }

            setButtonLoading(
                submitButton,
                true,
                "正在保存……"
            );

            try {
                const { error } =
                    await supabaseClient.auth
                        .updateUser({
                            password
                        });

                if (error) {
                    throw error;
                }

                await supabaseClient.auth
                    .signOut();

                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );

                form.reset();
                showPanel("login");

                showMessage(
                    "密码修改成功，请使用新密码重新登录。",
                    "success"
                );
            } catch (error) {
                console.error(
                    "Password update failed:",
                    error?.message
                );

                showMessage(
                    translateAuthError(error),
                    "error"
                );
            } finally {
                setButtonLoading(
                    submitButton,
                    false,
                    "正在保存……"
                );
            }
        }
    );
}

function initializeVerificationResend() {
    const resendButton =
        document.querySelector(
            "#resend-verification"
        );

    const emailInput =
        document.querySelector("#login-email");

    resendButton?.addEventListener(
        "click",
        async () => {
            hideMessage();

            const email =
                emailInput.value.trim();

            const result =
                validateEmail(email);

            setFieldError(
                "login-email",
                "login-email-error",
                result.message
            );

            if (!result.valid) {
                showMessage(
                    "请先填写正确的注册邮箱。",
                    "error"
                );
                return;
            }

            setButtonLoading(
                resendButton,
                true,
                "正在发送……"
            );

            try {
                const { error } =
                    await supabaseClient.auth
                        .resend({
                            type: "signup",
                            email,
                            options: {
                                emailRedirectTo:
                                    PRODUCTION_AUTH_URL
                            }
                        });

                if (error) {
                    throw error;
                }

                showMessage(
                    "验证邮件已重新发送，请检查邮箱。若暂未收到，请同时检查垃圾邮件。",
                    "success"
                );
            } catch (error) {
                console.error(
                    "Verification resend failed:",
                    error?.message
                );

                showMessage(
                    translateAuthError(error),
                    "error"
                );
            } finally {
                setButtonLoading(
                    resendButton,
                    false,
                    "正在发送……"
                );
            }
        }
    );
}

initializeTabs();
initializePasswordToggles();
initializePanelNavigation();
initializeLoginForm();
initializeRegisterForm();
initializeForgotPasswordForm();
initializeResetPasswordForm();
initializeVerificationResend();
initializePasswordRecovery();

async function checkSupabaseConnection() {
    if (!isSupabaseConfigured()) {
        showMessage(
            "Supabase 配置尚未完成，请检查 Project URL 和 Publishable Key。",
            "error"
        );
        return;
    }

    try {
        const { error } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        console.info(
            "Supabase 连接成功，当前尚未登录。"
        );
    } catch (error) {
        console.error(
            "Supabase connection failed:",
            error?.message
        );

        showMessage(
            "登录服务连接失败，请检查网络或 Supabase 配置。",
            "error"
        );
    }
}

checkSupabaseConnection();

function initializePasswordRecovery() {
    if (!isSupabaseConfigured()) {
        return;
    }

    const showRecoveryPanel = () => {
        showPanel("reset-password");

        showMessage(
            "身份验证成功，请设置新的登录密码。",
            "success"
        );
    };

    const hashParameters =
        new URLSearchParams(
            window.location.hash.slice(1)
        );

    const queryParameters =
        new URLSearchParams(
            window.location.search
        );

    const callbackType =
        hashParameters.get("type") ||
        queryParameters.get("type");

    if (callbackType === "recovery") {
        showRecoveryPanel();
    }

    supabaseClient.auth.onAuthStateChange(
        (event) => {
            if (event === "PASSWORD_RECOVERY") {
                showRecoveryPanel();
            }
        }
    );
}
			
async function handleEmailConfirmation() {
    if (!isSupabaseConfigured()) {
        return;
    }

    const hashParameters =
        new URLSearchParams(
            window.location.hash.slice(1)
        );

    const queryParameters =
        new URLSearchParams(
            window.location.search
        );

    const callbackType =
        hashParameters.get("type") ||
        queryParameters.get("type");

    if (callbackType !== "signup") {
        return;
    }

    try {
        await new Promise((resolve) => {
            window.setTimeout(resolve, 700);
        });

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (!data.session?.user) {
            throw new Error(
                "Email confirmation session not found"
            );
        }

        await supabaseClient.auth.signOut();

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

        showPanel("login");

        showMessage(
            "邮箱验证成功，请使用邮箱和密码手动登录。",
            "success"
        );
    } catch (error) {
        console.error(
            "Email confirmation failed:",
            error?.message
        );

        showMessage(
            "邮箱验证链接无效或已经过期，请重新发送验证邮件。",
            "error"
        );
    }
}

handleEmailConfirmation();