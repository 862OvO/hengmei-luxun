import { getContentDetailUrl, loadPublishedContents } from "./content-service.js";
import { initializeFavoriteButtons } from "./favorite-ui.js";

const page = document.querySelector("[data-gallery-page]");
const eras = [
    ["early", "早年与求学", "1881—1909"],
    ["beijing", "北京时期", "1912—1926"],
    ["shanghai", "上海十年", "1927—1936"]
];
let records = [];
let visibleRecords = [];
let activeIndex = 0;

const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

function createFavorite(item) {
    const button = element("button", "favorite-button", "正在检测");
    button.type = "button";
    button.disabled = true;
    button.dataset.favoriteButton = "";
    button.dataset.contentId = item.id ?? "";
    button.dataset.contentType = item.content_type;
    button.dataset.slug = item.slug;
    button.dataset.title = item.title;
    button.setAttribute("aria-pressed", "false");
    return button;
}

function createCard(item, index) {
    const card = element("article", "gallery-card");
    if (item.metadata.category === "文献") {
        card.classList.add("gallery-card--document");
    }
    const media = element("div", "gallery-card-media");
    const image = document.createElement("img");
    image.src = item.image_path;
    image.alt = item.metadata.alt;
    image.loading = "lazy";
    image.decoding = "async";
    const classifyImage = () => {
        const ratio = image.naturalWidth / image.naturalHeight;
        media.classList.toggle("is-portrait", ratio < 0.86);
        media.classList.toggle("is-square", ratio >= 0.86 && ratio <= 1.2);
        media.classList.toggle("is-landscape", ratio > 1.2);
    };
    image.addEventListener("load", classifyImage, { once: true });
    if (image.complete && image.naturalWidth) classifyImage();
    const badge = element("span", "gallery-card-badge", item.metadata.category);
    const zoom = element("button", "gallery-zoom", "＋");
    zoom.type = "button";
    zoom.setAttribute("aria-label", `放大查看：${item.title}`);
    zoom.addEventListener("click", () => openLightbox(index));
    media.append(image, badge, zoom);

    const copy = element("div", "gallery-card-copy");
    copy.append(element("span", "gallery-card-number", String(index + 1).padStart(2, "0")));
    copy.append(element("div", "gallery-card-time", item.metadata.timeline_label));
    const title = element("h4", "", item.title);
    const summary = element("p", "gallery-card-summary", item.summary);
    const meta = element("div", "gallery-card-meta");
    meta.append(element("span", "", item.metadata.display_date), element("span", "", item.metadata.location));
    const actions = element("div", "gallery-card-actions");
    const detail = element("a", "", "查看档案 →");
    detail.href = getContentDetailUrl(item);
    actions.append(detail, createFavorite(item));
    copy.append(title, summary, meta, actions);
    card.append(media, copy);
    return card;
}

async function render(items) {
    const timeline = page.querySelector("[data-gallery-timeline]");
    visibleRecords = items;
    if (items.length === 0) {
        const state = element("div", "gallery-state");
        state.append(element("strong", "", "没有符合条件的影像"), element("span", "", "请调整类型或搜索关键词。"));
        timeline.replaceChildren(state);
        return;
    }
    const fragment = document.createDocumentFragment();
    eras.forEach(([key, title, range]) => {
        const eraItems = items.filter((item) => item.metadata.era === key);
        if (eraItems.length === 0) return;
        const section = element("section", "gallery-era");
        const heading = element("header", "gallery-era-heading");
        heading.append(element("span", "", range), element("h3", "", title));
        const grid = element("div", "gallery-grid");
        eraItems.forEach((item) => grid.append(createCard(item, items.indexOf(item))));
        section.append(heading, grid);
        fragment.append(section);
    });
    timeline.replaceChildren(fragment);
    await initializeFavoriteButtons(timeline);
}

function searchText(item) {
    return [item.title,item.summary,item.metadata.display_date,item.metadata.timeline_label,item.metadata.location,item.metadata.category,item.metadata.creator,...(item.metadata.keywords ?? [])].filter(Boolean).join(" ").toLocaleLowerCase("zh-CN");
}

function setupControls() {
    const search = page.querySelector("[data-gallery-search]");
    const buttons = [...page.querySelectorAll("[data-gallery-filter]")];
    const result = page.querySelector("[data-gallery-result]");
    let filter = "all";
    const update = () => {
        const query = search.value.trim().toLocaleLowerCase("zh-CN");
        const filtered = records.filter((item) => (filter === "all" || item.metadata.category === filter) && (!query || searchText(item).includes(query)));
        result.textContent = `当前显示 ${filtered.length} 份，共 ${records.length} 份`;
        render(filtered);
    };
    search.addEventListener("input", update);
    buttons.forEach((button) => button.addEventListener("click", () => {
        filter = button.dataset.galleryFilter ?? "all";
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        update();
    }));
    update();
}

const dialog = document.querySelector("[data-gallery-lightbox]");
function updateLightbox() {
    const item = visibleRecords[activeIndex];
    if (!item) return;
    const image = dialog.querySelector("[data-lightbox-image]");
    image.src = item.image_path;
    image.alt = item.metadata.alt;
    dialog.querySelector("[data-lightbox-index]").textContent = `${String(activeIndex + 1).padStart(2,"0")} / ${String(visibleRecords.length).padStart(2,"0")}`;
    dialog.querySelector("[data-lightbox-title]").textContent = item.title;
    dialog.querySelector("[data-lightbox-meta]").textContent = `${item.metadata.timeline_label} · ${item.metadata.location}`;
    dialog.querySelector("[data-lightbox-summary]").textContent = item.summary;
    dialog.querySelector("[data-lightbox-source]").textContent = `${item.metadata.creator} · ${item.metadata.source_name}`;
    dialog.querySelector("[data-lightbox-license]").textContent = item.metadata.license;
    dialog.querySelector("[data-lightbox-detail]").href = getContentDetailUrl(item);
}
function openLightbox(index) { activeIndex = index; updateLightbox(); dialog.showModal(); }
function moveLightbox(step) { activeIndex = (activeIndex + step + visibleRecords.length) % visibleRecords.length; updateLightbox(); }
dialog.querySelector("[data-lightbox-close]").addEventListener("click", () => dialog.close());
dialog.querySelector("[data-lightbox-previous]").addEventListener("click", () => moveLightbox(-1));
dialog.querySelector("[data-lightbox-next]").addEventListener("click", () => moveLightbox(1));
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("keydown", (event) => { if (event.key === "ArrowLeft") moveLightbox(-1); if (event.key === "ArrowRight") moveLightbox(1); });

async function initialize() {
    if (!page) return;
    const source = page.querySelector("[data-gallery-source]");
    const warning = page.querySelector("[data-gallery-warning]");
    try {
        const result = await loadPublishedContents("gallery");
        records = result.data;
        source.dataset.source = result.source;
        source.textContent = result.source === "supabase" ? "数据来源：云端馆藏" : "数据来源：本地备用";
        warning.hidden = result.source === "supabase";
        warning.textContent = result.warning ?? "当前正在使用本地备用数据。";
        setupControls();
    } catch (error) {
        console.error("Gallery failed:", error);
        source.textContent = "数据来源：读取失败";
        page.querySelector("[data-gallery-timeline]").textContent = "影像档案读取失败，请刷新后重试。";
    }
}
initialize();
