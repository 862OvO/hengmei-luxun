const FOOTER_CONTAINER_SELECTOR =
    ".site-footer .container";

const FOOTER_LINKS = [
    ["index.html", "展馆首页"],
    ["biography.html", "鲁迅生平"],
    ["works.html", "代表作品"],
    ["articles.html", "作品赏析"],
    ["gallery.html", "历史影像"],
    ["messages.html", "文化留言"]
];

function getCurrentPageName() {
    return (
        window.location.pathname
            .split("/")
            .pop() ||
        "index.html"
    );
}

function createFooterLink(href, label) {
    const link =
        document.createElement("a");

    link.className =
        "footer-link";

    link.href = href;

    link.textContent = label;

    if (
        getCurrentPageName() ===
        href
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
            const navigation =
                container.querySelector(
                    ".footer-links"
                ) ?? document.createElement("nav");

            navigation.className =
                "footer-links";

            navigation.dataset
                .footerLinks = "";

            navigation.setAttribute(
                "aria-label",
                "页脚导航"
            );

            navigation.replaceChildren(
                ...FOOTER_LINKS.map(
                    ([href, label]) =>
                        createFooterLink(href, label)
                )
            );

            if (!navigation.isConnected) {
                container.append(navigation);
            }
        });
}

initializeFooterLinks();
