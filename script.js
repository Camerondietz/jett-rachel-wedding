const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navbar = document.querySelector('.navbar');

function setMenu(open) {
    hamburger.classList.toggle('open', open);
    navMenu.classList.toggle('open', open);
    navbar.classList.toggle('menu-open', open);
}

hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(!navMenu.classList.contains('open'));
});

navMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setMenu(false);
});

document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        setMenu(false);
    }
});

const colorMap = {
    'section-green': 'bg-green',
    'section-orange': 'bg-orange',
    'section-pink': 'bg-pink',
};

function setNavColor(section) {
    const cls = Object.keys(colorMap).find((c) => section.classList.contains(c));
    if (!cls) return;
    navbar.classList.remove('bg-green', 'bg-orange', 'bg-pink');
    navbar.classList.add(colorMap[cls]);
}

const sections = document.querySelectorAll('.section');
if (sections.length) {
    setNavColor(sections[0]);
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) setNavColor(entry.target);
            });
        },
        { rootMargin: '-30px 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
}
