(function () {
  const DigitalNest = document.getElementById("DNLink");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const headIcon = document.getElementById("header-icon");

  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("[data-section]");

  let isScrolling = false;

  if (DigitalNest) {
    DigitalNest.style.cursor = "pointer";
    DigitalNest.addEventListener("click", () => {
      window.open("https://digitalnest.org", "_blank", "noopener");
    });
  }

  function setActive(hash) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });
  }

  function getNavOffset() {
    const nav = document.querySelector(".nav-container");
    if (!nav) return 70;
    return nav.getBoundingClientRect().bottom + 10;
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      const newSrc = isDark ? "images/darkmode.svg" : "images/lightmode.svg";

      [themeIcon, headIcon].forEach((icon) => {
        if (!icon) return;

        icon.style.transform = "scale(0)";
        icon.style.opacity = "0";

        setTimeout(() => {
          if (icon.tagName === "IMG") icon.src = newSrc;
          else icon.textContent = isDark ? "🌙" : "☀️";

          icon.style.opacity = "1";
          icon.style.transform = "scale(1)";
        }, 150);
      });
    });
  }

  const moveLayers = Array.from(document.querySelectorAll(".move")).map((el, index) => ({
    el,
    intensity: 20 - index * 3,
  }));

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

        if (rect.bottom <= 0) return;
        if (rect.top >= window.innerHeight) return;

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

  ["wheel", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(
      evt,
      () => {
        isScrolling = false;
      },
      { passive: true }
    );
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
          const y = window.scrollY + targetElement.getBoundingClientRect().top - offset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }

      setTimeout(() => {
        isScrolling = false;
      }, 900);
    });
  });
})();
