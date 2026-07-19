const HEADER_TOOLS_SELECTOR =
    ".header-tools";

const SEARCH_PAGE_NAME =
    "search.html";

let searchInstanceId = 0;

function createElement(
    tagName,
    className,
    textContent
) {
    const element =
        document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (textContent !== undefined) {
        element.textContent = textContent;
    }

    return element;
}

function getCurrentKeyword() {
    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    if (currentPage !== SEARCH_PAGE_NAME) {
        return "";
    }

    const parameters =
        new URLSearchParams(
            window.location.search
        );

    return (
        parameters.get("q") ?? ""
    ).trim();
}

function closeSearch(searchElement) {
    const toggle =
        searchElement.querySelector(
            "[data-header-search-toggle]"
        );

    searchElement.classList.remove(
        "is-open"
    );

    toggle?.setAttribute(
        "aria-expanded",
        "false"
    );
}

function closeOtherSearches(
    activeSearch
) {
    document
        .querySelectorAll(
            "[data-header-search]"
        )
        .forEach((searchElement) => {
            if (
                searchElement !==
                activeSearch
            ) {
                closeSearch(
                    searchElement
                );
            }
        });
}

function openSearch(searchElement) {
    const toggle =
        searchElement.querySelector(
            "[data-header-search-toggle]"
        );

    const input =
        searchElement.querySelector(
            "[data-header-search-input]"
        );

    closeOtherSearches(
        searchElement
    );

    searchElement.classList.add(
        "is-open"
    );

    toggle?.setAttribute(
        "aria-expanded",
        "true"
    );

    window.requestAnimationFrame(
        () => {
            input?.focus();
            input?.select();
        }
    );
}

function toggleSearch(searchElement) {
    if (
        searchElement.classList.contains(
            "is-open"
        )
    ) {
        closeSearch(searchElement);
        return;
    }

    openSearch(searchElement);
}

function createSearchIcon() {
    const icon =
        createElement(
            "span",
            "header-search-icon"
        );

    icon.setAttribute(
        "aria-hidden",
        "true"
    );

    return icon;
}

function createHeaderSearch() {
    searchInstanceId += 1;

    const searchId =
        `header-search-form-${searchInstanceId}`;

    const wrapper =
        createElement(
            "div",
            "header-search"
        );

    wrapper.dataset.headerSearch = "";

    const toggleButton =
        createElement(
            "button",
            "header-search-toggle"
        );

    toggleButton.type = "button";

    toggleButton.dataset
        .headerSearchToggle = "";

    toggleButton.setAttribute(
        "aria-label",
        "打开全站搜索"
    );

    toggleButton.setAttribute(
        "aria-expanded",
        "false"
    );

    toggleButton.setAttribute(
        "aria-controls",
        searchId
    );

    toggleButton.append(
        createSearchIcon()
    );

    const form =
        createElement(
            "form",
            "header-search-form"
        );

    form.id = searchId;
    form.action = SEARCH_PAGE_NAME;
    form.method = "get";
    form.setAttribute(
        "role",
        "search"
    );

    const input =
        document.createElement("input");

    input.className =
        "header-search-input";

    input.dataset.headerSearchInput = "";

    input.type = "search";
    input.name = "q";
    input.placeholder = "搜索作品、人物与时代背景";
    input.maxLength = 50;
    input.autocomplete = "off";

    input.setAttribute(
        "aria-label",
        "输入全站搜索关键词"
    );

    input.value =
        getCurrentKeyword();

    const submitButton =
        createElement(
            "button",
            "header-search-submit",
            "搜索"
        );

    submitButton.type = "submit";

    form.append(
        input,
        submitButton
    );

    wrapper.append(
        toggleButton,
        form
    );

    toggleButton.addEventListener(
        "click",
        () => {
            toggleSearch(wrapper);
        }
    );

    form.addEventListener(
        "submit",
        (event) => {
            const keyword =
                input.value.trim();

            if (!keyword) {
                event.preventDefault();
                input.focus();
                return;
            }

            input.value = keyword;
        }
    );

    wrapper.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Escape") {
                return;
            }

            closeSearch(wrapper);
            toggleButton.focus();
        }
    );

    return wrapper;
}

function initializeHeaderSearch() {
    document
        .querySelectorAll(
            HEADER_TOOLS_SELECTOR
        )
        .forEach((headerTools) => {
            if (
                headerTools.querySelector(
                    "[data-header-search]"
                )
            ) {
                return;
            }

            const accountActions =
                headerTools.querySelector(
                    "[data-auth-actions]"
                );

            const search =
                createHeaderSearch();

            if (accountActions) {
                headerTools.insertBefore(
                    search,
                    accountActions
                );
            } else {
                headerTools.append(search);
            }
        });

    document.addEventListener(
        "click",
        (event) => {
            document
                .querySelectorAll(
                    "[data-header-search].is-open"
                )
                .forEach(
                    (searchElement) => {
                        if (
                            searchElement
                                .contains(
                                    event.target
                                )
                        ) {
                            return;
                        }

                        closeSearch(
                            searchElement
                        );
                    }
                );
        }
    );
}

initializeHeaderSearch();