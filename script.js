(function () {
  /* -----------------------------
     CONSTANTS & DOM REFERENCES
  ------------------------------ */
  const THEME_KEY = "preferred-theme";

  const DigitalNest = document.getElementById("DNLink");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const headIcon = document.getElementById("header-icon");

  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("[data-section]");
  const main = document.querySelector("main.container");

  let isScrolling = false;

  /* -----------------------------
     EXTERNAL LINK
  ------------------------------ */
  if (DigitalNest) {
    DigitalNest.style.cursor = "pointer";
    DigitalNest.addEventListener("click", () => {
      window.open("https://digitalnest.org", "_blank", "noopener");
    });
  }

  /* -----------------------------
     THEME HANDLING
  ------------------------------ */
  function applyTheme(isDark, animate = false) {
    document.documentElement.classList.toggle("dark-mode", isDark);
    const newSrc = isDark ? "images/darkmode.svg" : "images/lightmode.svg";

    [themeIcon, headIcon].forEach((icon) => {
      if (!icon) return;

      if (!animate) {
        if (icon.tagName === "IMG") icon.src = newSrc;
        else icon.textContent = isDark ? "🌙" : "☀️";
        return;
      }

      icon.style.transform = "scale(0)";
      icon.style.opacity = "0";

      setTimeout(() => {
        if (icon.tagName === "IMG") icon.src = newSrc;
        else icon.textContent = isDark ? "🌙" : "☀️";

        icon.style.opacity = "1";
        icon.style.transform = "scale(1)";
      }, 150);
    });
  }

  // Restore saved theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    applyTheme(true);
  }

  // Toggle theme
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = !document.documentElement.classList.contains("dark-mode");
      applyTheme(isDark, true);
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    });
  }

  /* -----------------------------
     PAGE TRANSITIONS (MULTI-PAGE)
  ------------------------------ */
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("http") ||
      href.startsWith("mailto:")
    ) {
      return;
    }

    link.addEventListener("click", (e) => {
      e.preventDefault();
      main?.classList.add("page-exit");

      setTimeout(() => {
        window.location.href = href;
      }, 400);
    });
  });

  /* -----------------------------
     NAV ACTIVE STATE
  ------------------------------ */
  function setActive(hash) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });
  }

  function getNavOffset() {
    const nav = document.querySelector(".nav-container");
    return nav ? nav.getBoundingClientRect().bottom + 10 : 70;
  }

  /* -----------------------------
     AVATAR PARALLAX
  ------------------------------ */
  const moveLayers = Array.from(document.querySelectorAll(".move")).map(
    (el, index) => ({
      el,
      intensity: 20 - index * 3,
    })
  );

  if (moveLayers.length) {
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
          moveLayers.forEach(({ el, intensity }) => {
            const moveX = intensity * px - intensity / 2;
            const moveY = intensity * py - intensity / 2;
            el.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
          });
          raf = null;
        });
      },
      { passive: true }
    );
  }

  /* -----------------------------
     SCROLL-BASED NAV HIGHLIGHT
  ------------------------------ */
  if (sections.length && navLinks.length) {
    let lastActive = null;
    let raf = null;

    function updateActiveSection() {
      if (isScrolling) return;

      const anchorY = window.innerHeight * 0.45;
      let inBand = null;
      let best = null;
      let bestDist = Infinity;

      sections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

        if (rect.top <= anchorY && rect.bottom >= anchorY) {
          inBand = el;
          return;
        }

        const dist = Math.abs(rect.top - anchorY);
        if (dist < bestDist) {
          bestDist = dist;
          best = el;
        }
      });

      const chosen = inBand || best;
      if (!chosen) return;

      const id = chosen.dataset.section;
      if (!id || id === lastActive) return;

      lastActive = id;
      setActive(`#${id}`);
    }

    function requestUpdate() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        updateActiveSection();
      });
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("orientationchange", requestUpdate, { passive: true });

    requestUpdate();
  }

  /* -----------------------------
     NAV LINK SMOOTH SCROLL
  ------------------------------ */
  ["wheel", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(evt, () => {
      isScrolling = false;
    }, { passive: true });
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (!targetId || !targetId.startsWith("#")) return;

      e.preventDefault();
      isScrolling = true;
      setActive(targetId);

      if (targetId === "#home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offset = getNavOffset();
          const y =
            window.scrollY +
            targetElement.getBoundingClientRect().top -
            offset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }

      setTimeout(() => {
        isScrolling = false;
      }, 900);
    });
  });

  /* -----------------------------
     ENABLE TRANSITIONS AFTER LOAD
  ------------------------------ */
  requestAnimationFrame(() => {
    document.documentElement.classList.add("theme-ready");
    main?.classList.remove("page-exit");
  });
})();
