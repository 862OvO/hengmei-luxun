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
            updateNavigationOverflow(navigation);
        });
}

function updateNavigationOverflow(navigation) {
    const maxScroll = Math.max(
        0,
        navigation.scrollWidth - navigation.clientWidth
    );
    const tolerance = 2;

    navigation.classList.toggle(
        "can-scroll-left",
        navigation.scrollLeft > tolerance
    );
    navigation.classList.toggle(
        "can-scroll-right",
        navigation.scrollLeft < maxScroll - tolerance
    );
}

function initializeNavigationOverflow() {
    document
        .querySelectorAll(`${STANDARD_HEADER_SELECTOR} .site-nav`)
        .forEach((navigation) => {
            updateNavigationOverflow(navigation);
            navigation.addEventListener("scroll", () => {
                updateNavigationOverflow(navigation);
            }, { passive: true });
        });
}

function refreshNavigationOverflow() {
    document
        .querySelectorAll(`${STANDARD_HEADER_SELECTOR} .site-nav`)
        .forEach(updateNavigationOverflow);
}

function initializeReadingTools() {
    const main = document.querySelector("main");

    if (!main || document.querySelector("[data-reading-tools]")) {
        return;
    }

    const tools = document.createElement("div");
    const meter = document.createElement("span");
    const button = document.createElement("button");

    tools.className = "reading-tools";
    tools.dataset.readingTools = "";
    meter.className = "reading-tools-meter";
    meter.setAttribute("aria-hidden", "true");
    button.className = "reading-tools-top";
    button.type = "button";
    button.textContent = "↑";
    button.setAttribute("aria-label", "返回页面顶部");
    tools.append(meter, button);
    document.body.append(tools);

    const update = () => {
        const scrollRange = Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight
        );
        const progress = Math.min(1, Math.max(0, window.scrollY / scrollRange));
        const isLongPage = document.documentElement.scrollHeight > window.innerHeight * 3;

        tools.style.setProperty("--reading-progress", `${progress * 100}%`);
        tools.classList.toggle("is-available", isLongPage);
        tools.classList.toggle("is-visible", isLongPage && window.scrollY > window.innerHeight * 0.75);
    };

    button.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth"
        });
    });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    if ("ResizeObserver" in window) {
        new ResizeObserver(update).observe(main);
    }

    update();
}

function initializeCommonFrame() {
    if (!document.querySelector(STANDARD_HEADER_SELECTOR)) {
        return;
    }

    document.documentElement.classList.add("common-frame-ready");

    const main = ensureMainTarget();
    ensureSkipLink(main);
    labelBrand();
    initializeNavigationOverflow();
    initializeReadingTools();

    window.requestAnimationFrame(centerActiveNavigation);
    window.addEventListener("resize", () => {
        centerActiveNavigation();
        refreshNavigationOverflow();
    });
}

initializeCommonFrame();
