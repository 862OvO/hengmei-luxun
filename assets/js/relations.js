const DATA_URL = "assets/data/relations.json";

const CATEGORY_LABELS = {
    family: "家人与亲属",
    mentor: "师长与教育",
    peer: "友人与同人"
};

const state = { data: null, filter: "all" };

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function referenceLinks(ids) {
    const wrapper = element("span", "person-reference-links");
    wrapper.append("资料：");
    ids.forEach((id, index) => {
        const link = element("a", "inline-reference", `[${id}]`);
        link.href = `#relation-reference-${id}`;
        wrapper.append(link);
        if (index < ids.length - 1) wrapper.append(" ");
    });
    return wrapper;
}

function renderMap(people) {
    const root = document.querySelector("[data-map-nodes]");
    root.replaceChildren();

    people.forEach((person) => {
        const button = element("button", `map-node map-node--${person.category}`);
        button.type = "button";
        button.dataset.personId = person.id;
        button.setAttribute("aria-label", `${person.name}，${person.relation}，打开人物卡片`);
        button.append(element("span", "map-node-avatar", person.avatar));
        const copy = element("span", "map-node-copy");
        copy.append(element("strong", "", person.name));
        copy.append(element("small", "", person.relation));
        button.append(copy);
        button.addEventListener("click", () => revealPerson(person.id));
        root.append(button);
    });
}

function renderPeople(people) {
    const root = document.querySelector("[data-people-grid]");
    root.replaceChildren();

    people.forEach((person, index) => {
        const details = element("details", `person-card person-card--${person.category}`);
        details.id = `person-${person.id}`;
        details.dataset.personId = person.id;
        details.dataset.record = String(index + 1).padStart(2, "0");

        const summary = element("summary", "person-card-summary");
        const portrait = element("span", "person-portrait");
        if (person.image) {
            const image = element("img");
            image.src = person.image;
            image.alt = person.imageAlt;
            image.loading = "lazy";
            image.decoding = "async";
            portrait.append(image);
        } else {
            portrait.append(element("span", "person-avatar", person.avatar));
        }

        const heading = element("span", "person-heading");
        heading.append(element("span", "person-index", `FILE ${String(index + 1).padStart(2, "0")}`));
        heading.append(element("span", "person-category", CATEGORY_LABELS[person.category]));
        heading.append(element("strong", "person-name", person.name));
        heading.append(element("span", "person-years", person.years));
        heading.append(element("span", "person-relation", person.relation));
        const indicator = element("span", "person-toggle");
        indicator.setAttribute("aria-hidden", "true");
        summary.append(portrait, heading, indicator);

        const content = element("div", "person-card-content");
        content.append(element("p", "person-summary", person.summary));
        content.append(element("p", "", person.detail));
        const event = element("div", "person-key-event");
        event.append(element("span", "", person.event.year));
        const eventCopy = element("div");
        eventCopy.append(element("strong", "", person.event.title));
        eventCopy.append(element("p", "", person.event.text));
        event.append(eventCopy);
        content.append(event, referenceLinks(person.references));
        details.append(summary, content);
        root.append(details);
    });
}

function renderTimeline(people) {
    const root = document.querySelector("[data-timeline]");
    root.replaceChildren();
    [...people]
        .sort((a, b) => Number(a.event.year) - Number(b.event.year))
        .forEach((person, index) => {
            const item = element("li", `interaction-item interaction-item--${person.category}`);
            item.dataset.personId = person.id;
            item.dataset.record = String(index + 1).padStart(2, "0");
            item.append(element("span", "interaction-index", String(index + 1).padStart(2, "0")));
            const year = element("time", "interaction-year", person.event.year);
            year.dateTime = person.event.year;
            const copy = element("div", "interaction-copy");
            const label = element("span", "interaction-person", `${person.name} · ${CATEGORY_LABELS[person.category]}`);
            copy.append(label, element("h3", "", person.event.title), element("p", "", person.event.text));
            item.append(year, copy);
            root.append(item);
        });
}

function renderReferences(references) {
    const root = document.querySelector("[data-reference-list]");
    root.replaceChildren();
    references.forEach((reference) => {
        const item = element("li", "reference-item");
        item.id = `relation-reference-${reference.id}`;
        const number = element("span", "reference-number", `[${reference.id}]`);
        const copy = element("div");
        const link = element("a", "", reference.title);
        link.href = reference.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        copy.append(link, element("span", "", reference.publisher));
        item.append(number, copy);
        root.append(item);
    });
}

function revealPerson(personId) {
    if (state.filter !== "all") {
        const person = state.data.people.find((item) => item.id === personId);
        if (person && person.category !== state.filter) setFilter("all");
    }
    const card = document.querySelector(`#person-${CSS.escape(personId)}`);
    if (!card) return;
    card.open = true;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => card.querySelector("summary")?.focus({ preventScroll: true }), 450);
}

function setFilter(filter) {
    state.filter = filter;
    const visible = filter === "all"
        ? state.data.people
        : state.data.people.filter((person) => person.category === filter);

    document.querySelectorAll("[data-filter]").forEach((button) => {
        const active = button.dataset.filter === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    renderMap(visible);
    renderPeople(visible);
    renderTimeline(visible);
    const label = filter === "all" ? "全部" : CATEGORY_LABELS[filter];
    document.querySelector("[data-map-status]").textContent = `当前显示${label} ${visible.length} 位人物。`;
}

async function init() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.data = await response.json();
        renderReferences(state.data.references);
        setFilter("all");
        document.querySelectorAll("[data-filter]").forEach((button) => {
            button.addEventListener("click", () => setFilter(button.dataset.filter));
        });
    } catch (error) {
        const message = element("p", "relations-error", "人物资料暂时无法载入，请刷新页面后重试。");
        document.querySelector("[data-people-grid]").replaceChildren(message);
        document.querySelector("[data-map-status]").textContent = "人物资料载入失败。";
        console.error("Failed to load relationship data:", error);
    }
}

init();
