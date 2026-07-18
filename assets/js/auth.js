import {
    validateEmail,
    validateNickname,
    validatePassword
} from "./auth-utils.js";

const authTabs = document.querySelector(".auth-tabs");
const tabButtons = document.querySelectorAll("[data-auth-tab]");
const formPanels = document.querySelectorAll("[data-auth-panel]");
const authMessage = document.querySelector("#auth-message");

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

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        clearFormErrors(form);
        hideMessage();

        const email =
            document.querySelector("#login-email").value;

        const password =
            document.querySelector("#login-password").value;

        const emailResult = validateEmail(email);
        const passwordResult = validatePassword(password);

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

        showMessage(
            "登录表单校验通过。下一阶段连接 Supabase 后即可登录。",
            "success"
        );
    });
}

function initializeRegisterForm() {
    const form = document.querySelector("#register-form");

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        clearFormErrors(form);
        hideMessage();

        const nickname =
            document.querySelector("#register-nickname").value;

        const email =
            document.querySelector("#register-email").value;

        const password =
            document.querySelector("#register-password").value;

        const passwordConfirm =
            document.querySelector(
                "#register-password-confirm"
            ).value;

        const agreement =
            document.querySelector(
                "#register-agreement"
            ).checked;

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

        showMessage(
            "注册表单校验通过。下一阶段连接 Supabase 后即可提交注册。",
            "success"
        );
    });
}

function initializeForgotPasswordForm() {
    const form =
        document.querySelector("#forgot-password-form");

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        clearFormErrors(form);
        hideMessage();

        const email =
            document.querySelector("#forgot-email").value;

        const result = validateEmail(email);

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

        showMessage(
            "邮箱格式校验通过。连接 Supabase 后将发送重置邮件。",
            "success"
        );
    });
}

function initializeResetPasswordForm() {
    const form =
        document.querySelector("#reset-password-form");

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        clearFormErrors(form);
        hideMessage();

        const password =
            document.querySelector("#reset-password").value;

        const confirmPassword =
            document.querySelector(
                "#reset-password-confirm"
            ).value;

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

        showMessage(
            "新密码格式校验通过。",
            "success"
        );
    });
}

initializeTabs();
initializePasswordToggles();
initializePanelNavigation();
initializeLoginForm();
initializeRegisterForm();
initializeForgotPasswordForm();
initializeResetPasswordForm();