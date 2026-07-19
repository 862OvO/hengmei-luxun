const FOOTER_CONTAINER_SELECTOR =
    ".site-footer .container";

function getCurrentPageName() {
    return (
        window.location.pathname
            .split("/")
            .pop() ||
        "index.html"
    );
}

function createMessageLink() {
    const link =
        document.createElement("a");

    link.className =
        "footer-link";

    link.href =
        "messages.html";

    link.textContent =
        "文化留言板";

    if (
        getCurrentPageName() ===
        "messages.html"
    ) {
        link.classList.add(
            "active"
        );

        link.setAttribute(
            "aria-current",
            "page"
        );
    }

    return link;
}

function initializeFooterLinks() {
    document
        .querySelectorAll(
            FOOTER_CONTAINER_SELECTOR
        )
        .forEach((container) => {
            if (
                container.querySelector(
                    "[data-footer-links]"
                )
            ) {
                return;
            }

            const navigation =
                document.createElement(
                    "nav"
                );

            navigation.className =
                "footer-links";

            navigation.dataset
                .footerLinks = "";

            navigation.setAttribute(
                "aria-label",
                "页脚导航"
            );

            navigation.append(
                createMessageLink()
            );

            container.append(
                navigation
            );
        });
}

initializeFooterLinks();