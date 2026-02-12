(function () {
    console.log("running js");
    const THEME_KEY = "preferred-theme";
    const app = document.getElementById("app");
    const TRANSITION_DURATION = 400;

    if (!app) return;

    const HOME_FILE = "pages/home.html";
    const PLAY_FILE = "pages/play.html";
    const ABOUT_FILE = "pages/about.html";

    const BASE_PATH = (() => {
        let p = location.pathname || "/";
        if (!p.endsWith("/")) {
            p = p.substring(0, p.lastIndexOf("/") + 1);
        }
        return p;
    })();

    const normalizePath = (p) => (p || "").replace(/^\//, "");
    const toFetchUrl = (p) => BASE_PATH + normalizePath(p);

    let isScrolling = false;

    let navLinksRef = [];
    let sectionsRef = [];
    let moveLayersRef = [];
    let lastActive = null;

    let scrollListenerAttached = false;
    let pointerListenerAttached = false;

    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const headIcon = document.getElementById("header-icon");

    function applyTheme(isDark, animate = false) {
        document.documentElement.classList.toggle("dark-mode", isDark);
        const newSrc = toFetchUrl(isDark ? "images/darkmode.svg" : "images/lightmode.svg");

        [themeIcon, headIcon].forEach((icon) => {
            if (!icon) return;

            if (!animate) {
                if (icon.tagName === "IMG") icon.src = newSrc;
                else icon.textContent = isDark ? "🌙" : "☀️";
                return;
            }

            icon.style.opacity = "0";
            icon.style.transform = "scale(0)";

            setTimeout(() => {
                if (icon.tagName === "IMG") icon.src = newSrc;
                else icon.textContent = isDark ? "🌙" : "☀️";

                icon.style.opacity = "1";
                icon.style.transform = "scale(1)";
            }, 150);
        });
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme === "dark");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const isDark = !document.documentElement.classList.contains("dark-mode");
            applyTheme(isDark, true);
            localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
        });
    }

    function getNavOffset() {
        const nav = document.querySelector(".nav-container");
        return nav ? nav.getBoundingClientRect().bottom + 10 : 70;
    }

    function isHomePath(path) {
        const base = normalizePath((path || "").split("#")[0]);
        return base === HOME_FILE || base === "index.html" || base === "" || base === ".";
    }

    function clearAllActive() {
        navLinksRef.forEach((l) => l.classList.remove("active"));
    }

    function setActiveByHash(hash) {
        navLinksRef.forEach((l) => {
            const linkHash = l.getAttribute("href")?.split("#")[1];
            l.classList.toggle("active", linkHash === hash);
        });
    }

    function setPlayActive(isActive) {
        navLinksRef.forEach((l) => {
            const href = normalizePath(l.getAttribute("href") || "");
            const base = href.split("#")[0];
            const isPlayLink = l.dataset.route === "play" || base === PLAY_FILE;
            if (isPlayLink) l.classList.toggle("active", isActive);
        });
    }

    function setAboutActive(isActive) {
        navLinksRef.forEach((l) => {
            const href = normalizePath(l.getAttribute("href") || "");
            const base = href.split("#")[0];
            const isAboutLink = l.dataset.route === "about" || base === ABOUT_FILE;
            if (isAboutLink) l.classList.toggle("active", isActive);
        });
    }

    function syncNavForPath(path) {
        clearAllActive();
        const base = normalizePath(path.split("#")[0]);

        if (base === PLAY_FILE) {
            setPlayActive(true);
            return;
        }

        if (base === ABOUT_FILE) {
            setAboutActive(true);
            return;
        }

        if (!isHomePath(path)) {
            return;
        }
    }

    function scrollToHash(hash, push = false) {
        const target = document.getElementById(hash);
        if (!target) return;

        if (push) {
            const url = `#${hash}`;
            history.pushState({ path: `${HOME_FILE}#${hash}` }, "", url);
        }

        setActiveByHash(hash);

        isScrolling = true;
        const y = window.scrollY + target.getBoundingClientRect().top - getNavOffset();
        window.scrollTo({ top: y, behavior: "smooth" });

        setTimeout(() => {
            isScrolling = false;
        }, 800);
    }

    function updateActiveSection() {
        if (isScrolling) return;
        if (!isHomePath(currentRoutePath())) return;
        if (!sectionsRef.length || !navLinksRef.length) return;

        if (window.scrollY <= 5) {
            lastActive = "home";
            setActiveByHash("home");
            return;
        }

        const anchorY = window.innerHeight * 0.45;
        let chosen = null;

        sectionsRef.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top <= anchorY && rect.bottom >= anchorY) chosen = el;
        });

        if (!chosen) return;

        const id = chosen.dataset.section;
        if (id && id !== lastActive) {
            lastActive = id;
            setActiveByHash(id);
        }
    }

    function initPageScripts() {
        navLinksRef = Array.from(document.querySelectorAll(".nav-link"));
        sectionsRef = Array.from(document.querySelectorAll("[data-section]"));
        moveLayersRef = Array.from(document.querySelectorAll(".move")).map((el, index) => ({
            el,
            intensity: 20 - index * 3
        }));

        lastActive = null;

        const DNLink = document.getElementById("DNLink");
        if (DNLink) {
            DNLink.style.cursor = "pointer";
            DNLink.onclick = () => window.open("https://digitalnest.org", "_blank", "noopener");
        }

        if (!pointerListenerAttached) {
            pointerListenerAttached = true;

            let px = 0.5;
            let py = 0.5;
            let raf = null;

            window.addEventListener(
                "pointermove",
                (e) => {
                    px = e.clientX / window.innerWidth;
                    py = e.clientY / window.innerHeight;

                    if (raf) return;
                    raf = requestAnimationFrame(() => {
                        if (moveLayersRef.length) {
                            moveLayersRef.forEach(({ el, intensity }) => {
                                const moveX = intensity * px - intensity / 2;
                                const moveY = intensity * py - intensity / 2;
                                el.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
                            });
                        }
                        raf = null;
                    });
                },
                { passive: true }
            );
        }

        if (!scrollListenerAttached) {
            scrollListenerAttached = true;
            window.addEventListener("scroll", updateActiveSection, { passive: true });
        }

        updateActiveSection();
    }

    function routeToUrlHash(path) {
        const [rawClean, hash] = (path || "").split("#");
        const cleanPath = normalizePath(rawClean);

        if (cleanPath === PLAY_FILE) return "#play";
        if (cleanPath === ABOUT_FILE) return "#about";
        if (cleanPath.startsWith("cases/")) return `#${cleanPath}`;
        if (cleanPath === HOME_FILE) return hash ? `#${hash}` : "#home";

        return "#home";
    }

    function urlHashToRoute(hashStr) {
        const h = (hashStr || "").replace(/^#/, "");
        if (!h) return `${HOME_FILE}#home`;
        if (h === "play") return PLAY_FILE;
        if (h === "about") return ABOUT_FILE;
        if (h.startsWith("cases/")) return h;
        return `${HOME_FILE}#${h}`;
    }

    function currentRoutePath() {
        return urlHashToRoute(location.hash);
    }

    async function navigateTo(path, addToHistory = true, isInitial = false) {
        const [rawClean, hash] = (path || "").split("#");
        const cleanPath = normalizePath(rawClean);

        if (!isInitial) {
            app.classList.add("page-exit");
            await new Promise((r) => setTimeout(r, TRANSITION_DURATION));
        }

        try {
            const res = await fetch(toFetchUrl(cleanPath));
            if (!res.ok) throw new Error("404");
            const html = await res.text();

            app.innerHTML = html;
            initPageScripts();

            const fullPath = hash ? `${cleanPath}#${hash}` : cleanPath;
            syncNavForPath(fullPath);

            if (addToHistory) {
                history.pushState({ path: fullPath }, "", routeToUrlHash(fullPath));
            }

            if (cleanPath === HOME_FILE) {
                if (hash) {
                    window.scrollTo(0, 0);
                    requestAnimationFrame(() => scrollToHash(hash, false));
                } else {
                    window.scrollTo(0, 0);
                    requestAnimationFrame(() => setActiveByHash("home"));
                }
            } else {
                window.scrollTo(0, 0);
            }
        } catch {
            app.innerHTML = "<h1>404</h1><p>Page not found.</p>";
            clearAllActive();
            if (addToHistory) history.pushState({ path }, "", "#home");
            window.scrollTo(0, 0);
        }

        requestAnimationFrame(() => {
            app.classList.remove("page-exit");
        });
    }

    document.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;

        const hrefRaw = link.getAttribute("href");
        if (!hrefRaw || hrefRaw === "#") return;
        if (hrefRaw.startsWith("http") || hrefRaw.startsWith("mailto:")) return;

        const href = normalizePath(hrefRaw);

        if (href.includes("#")) {
            const [, hash] = href.split("#");
            e.preventDefault();

            const targetRoute = `${HOME_FILE}#${hash}`;
            const onHome = normalizePath(currentRoutePath().split("#")[0]) === HOME_FILE;

            if (!onHome) {
                navigateTo(targetRoute);
                return;
            }

            scrollToHash(hash, false);
            return;
        }

        e.preventDefault();
        navigateTo(href);
    });

    window.addEventListener("popstate", (e) => {
        const statePath = e.state?.path;
        const path = statePath || currentRoutePath() || `${HOME_FILE}#home`;
        navigateTo(path, false);
    });

    const initialRoute = currentRoutePath();
    navigateTo(initialRoute, false, true);

    requestAnimationFrame(() => {
        document.documentElement.classList.add("theme-ready");
    });
})();
