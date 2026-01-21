(function () {
    const DigitalNest = document.getElementById("DNLink");
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const headIcon = document.getElementById('header-icon');

    function reactiveMovement(el, maxX, maxY) {
        window.addEventListener("pointermove", (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const xPerc = clientX / innerWidth;
            const yPerc = clientY / innerHeight;
            const moveX = (maxX * xPerc) - (maxX / 2);
            const moveY = (maxY * yPerc) - (maxY / 2);
            el.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        });
    }

    document.querySelectorAll(".move").forEach((layer, index) => {
        const intensity = 20 - index * 3;
        reactiveMovement(layer, intensity, intensity);
    });

    if (DigitalNest) {
        DigitalNest.addEventListener("click", () => {
            window.open('https://digitalnest.org/', '_blank');
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            const emoji = isDark ? '🌙' : '☀️';

            [themeIcon, headIcon].forEach(icon => {
                if (icon) {
                    icon.style.transition = "transform 0.15s ease, opacity 0.15s ease";
                    icon.style.transform = "scale(0)";
                    icon.style.opacity = "0";

                    setTimeout(() => {
                        icon.textContent = emoji;
                        icon.style.opacity = "1";
                        icon.style.transform = "scale(1.2)";
                        setTimeout(() => {
                            icon.style.transform = "scale(1)";
                        }, 100);
                    }, 150);
                }
            });
        });
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });
})();