import {
    loadPublicMessages
} from "./message-service.js";

const revealElements = [
    ...document.querySelectorAll(
        "[data-reveal]"
    )
];

const sectionElements = [
    ...document.querySelectorAll(
        "[data-home-section]"
    )
];

const progressLinks = [
    ...document.querySelectorAll(
        "[data-home-progress-link]"
    )
];

const prefersReducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

function initializeReveal() {
    if (
        revealElements.length === 0 ||
        prefersReducedMotion.matches ||
        !("IntersectionObserver" in window)
    ) {
        revealElements.forEach(
            (element) => {
                element.classList.add(
                    "is-visible"
                );
            }
        );

        return;
    }

    const observer =
        new IntersectionObserver(
            (entries) => {
                entries.forEach(
                    (entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.add(
                            "is-visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                );
            },
            {
                threshold: 0.12,
                rootMargin:
                    "0px 0px -8% 0px"
            }
        );

    revealElements.forEach(
        (element) => {
            observer.observe(element);
        }
    );
}

function setActiveSection(sectionId) {
    progressLinks.forEach(
        (link) => {
            const isActive =
                link.dataset
                    .homeProgressLink ===
                sectionId;

            if (isActive) {
                link.setAttribute(
                    "aria-current",
                    "true"
                );
            } else {
                link.removeAttribute(
                    "aria-current"
                );
            }
        }
    );
}

function initializeSectionProgress() {
    if (
        sectionElements.length === 0 ||
        !("IntersectionObserver" in window)
    ) {
        return;
    }

    const observer =
        new IntersectionObserver(
            (entries) => {
                const visibleEntry =
                    entries
                        .filter(
                            (entry) =>
                                entry.isIntersecting
                        )
                        .sort(
                            (left, right) =>
                                right
                                    .intersectionRatio -
                                left
                                    .intersectionRatio
                        )[0];

                if (visibleEntry?.target.id) {
                    setActiveSection(
                        visibleEntry.target.id
                    );
                }
            },
            {
                threshold: [0.08, 0.25, 0.5],
                rootMargin:
                    "-30% 0px -55% 0px"
            }
        );

    sectionElements.forEach(
        (section) => {
            observer.observe(section);
        }
    );
}

function formatMessageDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return {
            dateTime: "",
            label: "近期"
        };
    }

    return {
        dateTime:
            date.toISOString(),
        label:
            new Intl.DateTimeFormat(
                "zh-CN",
                {
                    month: "short",
                    day: "numeric"
                }
            ).format(date)
    };
}

function createMessageCard(message) {
    const article =
        document.createElement(
            "article"
        );

    article.className =
        "echo-message";

    const content =
        document.createElement("p");

    content.textContent =
        `“${String(
            message.content ?? ""
        ).trim()}”`;

    const footer =
        document.createElement(
            "footer"
        );

    const nickname =
        document.createElement(
            "span"
        );

    nickname.textContent =
        String(
            message.nickname ??
            "访客"
        ).trim() || "访客";

    const time =
        document.createElement(
            "time"
        );

    const formattedDate =
        formatMessageDate(
            message.created_at
        );

    if (formattedDate.dateTime) {
        time.dateTime =
            formattedDate.dateTime;
    }

    time.textContent =
        formattedDate.label;

    footer.append(
        nickname,
        time
    );

    article.append(
        content,
        footer
    );

    return article;
}

function showMessageFallback(
    source,
    label
) {
    if (source) {
        source.textContent = label;
    }
}

async function initializeMessages() {
    const container =
        document.querySelector(
            "[data-home-messages]"
        );

    const source =
        document.querySelector(
            "[data-home-message-source]"
        );

    if (!container) {
        return;
    }

    try {
        const result =
            await loadPublicMessages(
                1,
                3
            );

        const messages =
            result.data.filter(
                (message) =>
                    String(
                        message.content ?? ""
                    ).trim()
            );

        if (messages.length === 0) {
            showMessageFallback(
                source,
                "暂无审核留言 · 展馆导语"
            );
            return;
        }

        container.replaceChildren(
            ...messages.map(
                createMessageCard
            )
        );

        if (source) {
            source.textContent =
                `来自 ${result.count} 条审核留言`;
        }
    } catch (error) {
        console.warn(
            "Homepage messages unavailable:",
            error
        );

        showMessageFallback(
            source,
            "留言暂不可用 · 展馆导语"
        );
    }
}

document.body.classList.add(
    "home-enhanced"
);

initializeReveal();
initializeSectionProgress();
initializeMessages();
