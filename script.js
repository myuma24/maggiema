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

    function applyTheme(isDark, animate = false) {
        document.documentElement.classList.toggle("dark-mode", isDark);

        const newSrc = toFetchUrl(isDark ? "images/darkmode.svg" : "images/lightmode.svg");

        // Re-select every time because #header-icon may be injected later via navigateTo()
        const themeIcon = document.getElementById("theme-icon");
        const headIcon = document.getElementById("header-icon");

        [themeIcon, headIcon].forEach((icon) => {
            if (!icon) return;

            if (!animate) {
                if (icon.tagName === "IMG") {
                    icon.src = newSrc;
                } else {
                    icon.textContent = isDark ? "🌙" : "☀️";
                }
                return;
            }

            icon.style.opacity = "0";
            icon.style.transform = "scale(0)";

            setTimeout(() => {
                if (icon.tagName === "IMG") {
                    icon.src = newSrc;
                } else {
                    icon.textContent = isDark ? "🌙" : "☀️";
                }

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

        const stack = document.getElementById('cardStack');
        const nextBtn = document.getElementById('stackNextBtn');
        const counter = document.getElementById('cardCounter');
        const textContents = document.querySelectorAll('.text-content');
        const cards = document.querySelectorAll('.stack-card');

        if (stack && nextBtn) {
            const buttonLabels = [
                "My Education",
                "My Experience",
                "My Hobbies",
                "My Philosophy",
                "Back to Intro"
            ];

            let currentIndex = 0;
            const totalCards = cards.length;

            function updateStackVisuals() {
                cards.forEach((card) => {
                    const cardIndex = parseInt(card.style.getPropertyValue('--index'));
                    if (cardIndex > currentIndex && !card.classList.contains('top')) {
                        const depth = cardIndex - currentIndex;
                        const rotation = depth * 4;
                        card.style.transform = `rotate(-${rotation}deg)`;
                    } else if (cardIndex === currentIndex && !card.classList.contains('top')) {
                        card.style.transform = 'rotate(0deg)';
                    }
                });
            }

            function handleNext() {
                if (currentIndex === totalCards - 1) {
                    currentIndex = 0;
                    cards.forEach((card, i) => {
                        setTimeout(() => {
                            card.classList.remove('top');
                            updateStackVisuals();
                        }, (totalCards - i) * 100);
                    });
                } else {
                    const topCard = cards[currentIndex];
                    topCard.classList.add('top');
                    currentIndex++;
                    updateStackVisuals();
                }

                textContents.forEach(content => {
                    content.classList.toggle('active', parseInt(content.dataset.card) === currentIndex);
                });

                if (counter) counter.textContent = `${currentIndex + 1} / ${totalCards}`;
                nextBtn.textContent = buttonLabels[currentIndex];
                updateCurrentStatus();
            }

            nextBtn.onclick = handleNext;
            stack.onclick = handleNext;
            updateStackVisuals();
        }

        if (!pointerListenerAttached) {
            pointerListenerAttached = true;
            let px = 0.5, py = 0.5, raf = null;
            window.addEventListener("pointermove", (e) => {
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
            }, { passive: true });
        }

        if (!scrollListenerAttached) {
            scrollListenerAttached = true;
            window.addEventListener("scroll", updateActiveSection, { passive: true });
        }

        updateCurrentStatus();
        updateActiveSection();
    }

    function routeToUrlHash(path) {
        const [rawClean, hash] = (path || "").split("#");
        const cleanPath = normalizePath(rawClean);

        if (cleanPath === HOME_FILE) return hash ? `#${hash}` : "#home";
        if (cleanPath === PLAY_FILE) return "#play";
        if (cleanPath === ABOUT_FILE) return "#about";

        if (cleanPath.startsWith("pages/")) return `#${cleanPath}`;
        if (cleanPath.startsWith("cases/")) return `#${cleanPath}`;

        return "#home";
    }

    function urlHashToRoute(hashStr) {
        const h = (hashStr || "").replace(/^#/, "");

        if (!h) return `${HOME_FILE}#home`;
        if (h === "play") return PLAY_FILE;
        if (h === "about") return ABOUT_FILE;
        if (h.startsWith("pages/")) return h;
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

            // Re-apply current theme so icons injected by new page get synced immediately
            applyTheme(document.documentElement.classList.contains("dark-mode"), false);

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
            const [baseRaw, hash] = href.split("#");
            e.preventDefault();

            const base = normalizePath(baseRaw);
            const onHome = normalizePath(currentRoutePath().split("#")[0]) === HOME_FILE;

            if (!base || base === HOME_FILE) {
                const targetRoute = `${HOME_FILE}#${hash}`;

                if (!onHome) {
                    navigateTo(targetRoute);
                    return;
                }

                scrollToHash(hash, false);
                return;
            }

            navigateTo(`${base}#${hash}`);
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

    (function initLightbox() {
        let box = document.getElementById("lightbox");

        function ensureLightbox() {
            if (box) return box;

            box = document.createElement("div");
            box.id = "lightbox";
            box.className = "lightbox";
            box.innerHTML = `
      <div class="lightbox-inner">
        <button class="lightbox-close" type="button" aria-label="Close">✕</button>
        <img class="lightbox-img" alt="">
      </div>
    `;
            document.body.appendChild(box);
            return box;
        }

        function openLightbox(src, alt) {
            const el = ensureLightbox();
            const img = el.querySelector(".lightbox-img");
            img.src = src;
            img.alt = alt || "";
            el.classList.add("is-open");
            document.body.style.overflow = "hidden";
        }

        function closeLightbox() {
            if (!box) return;

            const img = box.querySelector(".lightbox-img");
            box.classList.remove("is-open");
            img.src = "";
            img.alt = "";
            document.body.style.overflow = "";
        }

        document.addEventListener("click", (e) => {
            const tile = e.target.closest(".bento-tile");
            if (tile) {
                e.preventDefault();
                const full = tile.getAttribute("data-full");
                const img = tile.querySelector("img");
                if (full) openLightbox(full, img ? img.alt : "");
                return;
            }

            if (e.target.closest(".lightbox-close")) {
                e.preventDefault();
                closeLightbox();
                return;
            }

            if (e.target.id === "lightbox") closeLightbox();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeLightbox();
        });
    })();


    function updateCurrentStatus() {
        const statusElement = document.getElementById('status-text');
        if (!statusElement) return;

        const statuses = [
            "obsessing over every pixel",
            "searching for the perfect UI animation",
            "re-organizing my pokemon cards",
            "debating if I should learn React",
            "hunting for a missing curly bracket",
            "attempting to debug a layout issue that mysteriously resolved itself",
            "contemplating the meaning of life through CSS",
            "trying to find a good excuse to take a break",
            "looking for that one line of code I just wrote",
            "attempting to explain to my non-tech friends what I do for a living",
            "attempting my 30th honor mode run in Baldur's Gate 3",
            "obsessing over every pixel",
            'looking at pokemon cards on TCGPlayer for "research purposes"',
            "tackling my 12th Rolife build",
            "balding on baldurs gate",
            "trying to five-stack aram mayhem in League of Legends",
            "deciding if I should start a new farm in Stardew Valley",
            "jump roping in my backyard to stay active",
            "debating if I should get a switch just to play Tomodachi Life",
            "hard grinding the crimson witch domain",
            "watching tanks for nothin on Youtube",
            "figuring out what to have for lunch",
            "obsessing over every pixel",
            "hunting for the next card show",
            "hunting for new things to try in figma"
        ];

        // Pick a random status from the array
        const randomIndex = Math.floor(Math.random() * statuses.length);
        statusElement.textContent = statuses[randomIndex];
    }
})();