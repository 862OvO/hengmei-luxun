import {
    completePendingFavorite,
    getFavoriteContentIds,
    toggleFavorite
} from "./favorite-service.js";

let toastTimer = null;

function getToastElement() {
    let toast =
        document.querySelector(
            "[data-favorite-toast]"
        );

    if (toast) {
        return toast;
    }

    toast =
        document.createElement("div");

    toast.className =
        "favorite-toast";

    toast.dataset.favoriteToast = "";

    toast.setAttribute(
        "role",
        "status"
    );

    toast.setAttribute(
        "aria-live",
        "polite"
    );

    toast.hidden = true;

    document.body.append(toast);

    return toast;
}

function showToast(
    message,
    isError = false
) {
    const toast =
        getToastElement();

    toast.textContent = message;

    toast.dataset.type =
        isError
            ? "error"
            : "success";

    toast.hidden = false;

    window.clearTimeout(
        toastTimer
    );

    toastTimer =
        window.setTimeout(
            () => {
                toast.hidden = true;
            },
            3200
        );
}

function setButtonState(
    button,
    isFavorite
) {
    button.dataset.favoriteState =
        String(isFavorite);

    button.setAttribute(
        "aria-pressed",
        String(isFavorite)
    );

    button.textContent =
        isFavorite
            ? "已收藏"
            : "收藏";

    button.disabled = false;
}

function setButtonUnavailable(
    button
) {
    button.dataset.favoriteState =
        "false";

    button.setAttribute(
        "aria-pressed",
        "false"
    );

    button.textContent =
        "收藏暂不可用";

    button.disabled = true;
}

function synchronizeButtons(
    contentId,
    isFavorite
) {
    document
        .querySelectorAll(
            "[data-favorite-button]"
        )
        .forEach((button) => {
            if (
                button.dataset
                    .contentId ===
                contentId
            ) {
                setButtonState(
                    button,
                    isFavorite
                );
            }
        });
}

function readButtonItem(
    button
) {
    return {
        contentId:
            button.dataset.contentId,

        contentType:
            button.dataset.contentType,

        slug:
            button.dataset.slug,

        title:
            button.dataset.title
    };
}

async function handleButtonClick(
    button
) {
    if (
        button.disabled ||
        button.dataset.busy === "true"
    ) {
        return;
    }

    const item =
        readButtonItem(button);

    const currentlyFavorite =
        button.dataset
            .favoriteState ===
        "true";

    button.dataset.busy = "true";
    button.disabled = true;
    button.textContent = "处理中…";

    try {
        const result =
            await toggleFavorite(
                item,
                currentlyFavorite
            );

        if (result.redirected) {
            return;
        }

        if (result.unavailable) {
            setButtonUnavailable(
                button
            );

            showToast(
                "离线备用内容暂时不能收藏。",
                true
            );

            return;
        }

        synchronizeButtons(
            item.contentId,
            result.isFavorite
        );

        showToast(
            result.isFavorite
                ? "收藏成功"
                : "已取消收藏"
        );
    } catch (error) {
        console.error(
            "Favorite operation failed:",
            error
        );

        setButtonState(
            button,
            currentlyFavorite
        );

        showToast(
            "收藏操作失败，请稍后重试。",
            true
        );
    } finally {
        button.dataset.busy =
            "false";
    }
}

export async function initializeFavoriteButtons(
    root = document
) {
    const buttons =
        [...root.querySelectorAll(
            "[data-favorite-button]"
        )].filter(
            (button) =>
                button.dataset
                    .favoriteReady !==
                "true"
        );

    if (buttons.length === 0) {
        return;
    }

    buttons.forEach((button) => {
        button.dataset.favoriteReady =
            "true";

        button.addEventListener(
            "click",
            () => {
                handleButtonClick(
                    button
                );
            }
        );
    });

    const validButtons =
        buttons.filter(
            (button) =>
                button.dataset.contentId
        );

    buttons
        .filter(
            (button) =>
                !button.dataset.contentId
        )
        .forEach(
            setButtonUnavailable
        );

    if (validButtons.length === 0) {
        return;
    }

    try {
        const {
            favoriteIds
        } =
            await getFavoriteContentIds(
                validButtons.map(
                    (button) =>
                        button.dataset
                            .contentId
                )
            );

        validButtons.forEach(
            (button) => {
                setButtonState(
                    button,
                    favoriteIds.has(
                        button.dataset
                            .contentId
                    )
                );
            }
        );
    } catch (error) {
        console.error(
            "Favorite state failed:",
            error
        );

        validButtons.forEach(
            setButtonUnavailable
        );
    }
}

async function processPendingFavorite() {
    try {
        const result =
            await completePendingFavorite();

        if (!result.completed) {
            return;
        }

        synchronizeButtons(
            result.contentId,
            true
        );

        showToast(
            result.title
                ? `已自动收藏《${result.title}》`
                : "登录成功，已自动收藏"
        );
    } catch (error) {
        console.error(
            "Pending favorite failed:",
            error
        );

        showToast(
            "登录成功，但自动收藏失败，请重新点击收藏。",
            true
        );
    }
}

processPendingFavorite();