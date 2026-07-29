const STANDARD_HEADER_SELECTOR =
    ".site-header:not(.auth-header)";

function ensureMainTarget() {
    const main = document.querySelector("main");

    if (!main) {
        return null;
    }

    if (!main.id) {
        main.id = "main-content";
    }

    return main;
}

function ensureSkipLink(main) {
    if (!main || document.querySelector(".skip-link")) {
        return;
    }

    const link = document.createElement("a");
    link.className = "skip-link";
    link.href = `#${main.id}`;
    link.textContent = "跳到展览正文";
    document.body.prepend(link);
}

function labelBrand() {
    document
        .querySelectorAll(`${STANDARD_HEADER_SELECTOR} .brand`)
        .forEach((brand) => {
            if (!brand.hasAttribute("aria-label")) {
                brand.setAttribute(
                    "aria-label",
                    "横眉·鲁迅文化数字展馆首页"
                );
            }
        });
}

function centerActiveNavigation() {
    if (!window.matchMedia("(max-width: 1180px)").matches) {
        return;
    }

    document
        .querySelectorAll(`${STANDARD_HEADER_SELECTOR} .site-nav`)
        .forEach((navigation) => {
            const active = navigation.querySelector(
                ".nav-link[aria-current='page'], .nav-link.active"
            );

            if (!active) {
                return;
            }

            const target =
                active.offsetLeft -
                (navigation.clientWidth - active.offsetWidth) / 2;

            navigation.scrollLeft = Math.max(0, target);
        });
}

function initializeCommonFrame() {
    if (!document.querySelector(STANDARD_HEADER_SELECTOR)) {
        return;
    }

    document.documentElement.classList.add("common-frame-ready");

    const main = ensureMainTarget();
    ensureSkipLink(main);
    labelBrand();

    window.requestAnimationFrame(centerActiveNavigation);
    window.addEventListener("resize", centerActiveNavigation);
}

initializeCommonFrame();
