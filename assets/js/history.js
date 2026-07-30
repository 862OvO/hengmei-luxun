const CATEGORY_LABELS = { crisis: "民族危机", reform: "制度变革", society: "社会教育", culture: "文学文化" };
const state = { data: null, filter: "all", expanded: false };

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function initialTimelineLimit() {
    return window.matchMedia("(max-width: 700px)").matches ? 6 : 10;
}

function updateTimelineAction(root, total, shown) {
    let button = document.querySelector("[data-history-more]");
    if (shown >= total) {
        button?.remove();
        return;
    }
    if (!button) {
        button = el("button", "progressive-list-action");
        button.type = "button";
        button.dataset.historyMore = "";
        button.addEventListener("click", () => {
            state.expanded = true;
            setFilter(state.filter, true);
        });
        root.after(button);
    }
    button.textContent = `继续展开其余 ${total - shown} 个时代节点`;
}

function renderTimeline(events) {
    const root = document.querySelector("[data-history-timeline]");
    const visibleEvents = state.filter === "all" && !state.expanded
        ? events.slice(0, initialTimelineLimit())
        : events;
    root.replaceChildren();
    visibleEvents.forEach((event, index) => {
        const article = el("article", `history-event history-event--${event.category}`);
        article.id = `history-${event.id}`;
        const rail = el("div", "history-event-rail");
        rail.append(el("span", "history-event-index", String(index + 1).padStart(2, "0")), el("time", "history-event-year", event.dateLabel));
        const details = el("details", "history-event-card");
        const summary = el("summary", "history-event-summary");
        const heading = el("span", "history-event-heading");
        heading.append(el("span", "history-event-category", CATEGORY_LABELS[event.category]), el("strong", "", event.title), el("span", "history-event-abstract", event.summary));
        const toggle = el("span", "history-event-toggle"); toggle.setAttribute("aria-hidden", "true");
        summary.append(heading, toggle);
        const body = el("div", "history-event-body");
        const impact = el("div", "history-impact"); impact.append(el("span", "", "对鲁迅的影响"), el("p", "", event.impact));
        const links = el("div", "history-event-links");
        event.related.forEach((item) => { const link = el("a", "", item.label); link.href = item.href; links.append(link); });
        const refs = el("span", "history-event-refs", "资料 ");
        event.references.forEach((id) => { const link = el("a", "", `[${id}]`); link.href = `#history-reference-${id}`; refs.append(link, " "); });
        body.append(impact, links, refs); details.append(summary, body); article.append(rail, details); root.append(article);
    });
    updateTimelineAction(root, events.length, visibleEvents.length);
}

function renderThemes(themes) {
    const root = document.querySelector("[data-theme-grid]");
    themes.forEach((theme) => {
        const card = el("article", `theme-card theme-card--${theme.category}`);
        const figure = el("figure", "theme-figure"); const image = el("img"); image.src = theme.image; image.alt = theme.imageAlt; image.loading = "lazy"; image.decoding = "async"; figure.append(image);
        const copy = el("div", "theme-copy"); copy.append(el("span", "theme-kicker", theme.kicker), el("h3", "", theme.title), el("p", "", theme.body));
        const list = el("ul", "theme-highlights"); theme.highlights.forEach((item) => list.append(el("li", "", item))); copy.append(list); card.append(figure, copy); root.append(card);
    });
}

function renderWorks(works, events) {
    const root = document.querySelector("[data-works-context]");
    works.forEach((work, index) => {
        const card = el("article", "work-context-card");
        card.append(el("span", "work-context-number", String(index + 1).padStart(2, "0")), el("span", "work-context-year", work.year), el("h3", "", work.title), el("p", "", work.context));
        const nodes = el("div", "work-context-events");
        work.eventIds.forEach((id) => {
            const event = events.find((item) => item.id === id); if (!event) return;
            const link = el("a", "", `${event.year} · ${event.title}`); link.href = `#history-${id}`; nodes.append(link);
        });
        const detail = el("a", "work-context-link", "阅读作品 →"); detail.href = `detail.html?type=works&slug=${work.slug}`;
        card.append(nodes, detail); root.append(card);
    });
}

function renderReferences(references) {
    const root = document.querySelector("[data-history-references]");
    references.forEach((reference) => {
        const item = el("li", "history-reference-item"); item.id = `history-reference-${reference.id}`;
        const number = el("span", "", `[${reference.id}]`); const copy = el("div");
        const link = el("a", "", reference.title); link.href = reference.url; link.target = "_blank"; link.rel = "noopener noreferrer";
        copy.append(link, el("small", "", reference.publisher)); item.append(number, copy); root.append(item);
    });
}

function setFilter(filter, preserveExpanded = false) {
    state.filter = filter;
    if (!preserveExpanded) state.expanded = filter !== "all";
    const events = filter === "all" ? state.data.events : state.data.events.filter((event) => event.category === filter);
    document.querySelectorAll("[data-history-filter]").forEach((button) => {
        const active = button.dataset.historyFilter === filter; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active));
    });
    renderTimeline(events);
    const label = filter === "all" ? "全部" : CATEGORY_LABELS[filter];
    const shown = filter === "all" && !state.expanded
        ? Math.min(events.length, initialTimelineLimit())
        : events.length;
    document.querySelector("[data-history-status]").textContent = shown === events.length
        ? `当前显示${label} ${events.length} 个节点。`
        : `当前显示 ${shown} / ${events.length} 个节点。`;
}

async function init() {
    try {
        const response = await fetch("assets/data/history.json"); if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.data = await response.json(); renderThemes(state.data.themes); renderWorks(state.data.works, state.data.events); renderReferences(state.data.references); setFilter("all");
        document.querySelectorAll("[data-history-filter]").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.historyFilter)));
        document.addEventListener("click", (event) => {
            const link = event.target.closest('a[href^="#history-"]'); if (!link || link.closest(".history-event-refs")) return;
            let card = document.querySelector(`${link.getAttribute("href")} details`);
            if (!card) {
                state.expanded = true;
                setFilter("all", true);
                card = document.querySelector(`${link.getAttribute("href")} details`);
            }
            if (card) card.open = true;
        });
    } catch (error) {
        const failure = el("div", "history-error");
        failure.append(el("p", "", "时代资料暂时无法载入，请检查网络连接后重试。"));
        const retry = el("button", "state-retry", "重新加载");
        retry.type = "button";
        retry.addEventListener("click", init);
        failure.append(retry);
        document.querySelector("[data-history-timeline]").replaceChildren(failure);
        console.error("Failed to load history data:", error);
    }
}

init();
