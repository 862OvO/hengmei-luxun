const timeline = document.querySelector(".biography-timeline-section");
const progress = document.querySelector(".biography-reading-progress i");
const revealItems = document.querySelectorAll(
    ".timeline-item, .biography-stage, .biography-era-wall, .reference-panel"
);
const stageSections = document.querySelectorAll("[data-biography-stage]");
const stageLinks = document.querySelectorAll("[data-biography-stage-link]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setActiveStage(stageId) {
    stageLinks.forEach((link) => {
        const active = link.dataset.biographyStageLink === stageId;
        link.classList.toggle("is-active", active);

        if (active) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function updateProgress() {
    if (!timeline || !progress) {
        return;
    }

    const rect = timeline.getBoundingClientRect();
    const available = Math.max(1, rect.height - window.innerHeight);
    const travelled = Math.min(available, Math.max(0, -rect.top));
    progress.style.transform = `scaleX(${travelled / available})`;
}

function initializeReveal() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    document.documentElement.classList.add("biography-enhanced");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { rootMargin: "0px 0px -8%", threshold: 0.08 }
    );

    revealItems.forEach((item) => observer.observe(item));
}

function updateActiveStage() {
    if (stageSections.length === 0) {
        return;
    }

    const readingLine = window.innerHeight * 0.34;
    let currentStage = stageSections[0];

    stageSections.forEach((stage) => {
        if (stage.getBoundingClientRect().top <= readingLine) {
            currentStage = stage;
        }
    });

    setActiveStage(currentStage.dataset.biographyStage);
}

initializeReveal();
updateProgress();
updateActiveStage();

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("scroll", updateActiveStage, { passive: true });
window.addEventListener("resize", updateProgress);
window.addEventListener("resize", updateActiveStage);
