const header = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const currentYear = document.getElementById("currentYear");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
const sections = [...document.querySelectorAll("main section[id]")];
const parallaxMedia = document.getElementById("parallaxMedia");
const reelCards = document.querySelectorAll(".reel-card[data-instagram-url]");

currentYear.textContent = new Date().getFullYear();
reelCards.forEach((card) => {
  card.href = card.dataset.instagramUrl || "https://www.instagram.com/";
});

function updateHeaderState() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function toggleMenu(forceOpen) {
  const shouldOpen =
    typeof forceOpen === "boolean" ? forceOpen : !siteNav.classList.contains("is-open");

  siteNav.classList.toggle("is-open", shouldOpen);
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
}

menuToggle.addEventListener("click", () => toggleMenu());

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 760) {
      toggleMenu(false);
    }
  });
});

document.addEventListener("click", (event) => {
  if (
    window.innerWidth <= 760 &&
    !siteNav.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    toggleMenu(false);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        const isMatch = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", isMatch);
      });
    });
  },
  { threshold: 0.5 }
);

sections.forEach((section) => sectionObserver.observe(section));

function updateParallax() {
  if (!parallaxMedia) return;

  const rect = parallaxMedia.parentElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = (clamped - 0.5) * 50;

  parallaxMedia.style.transform = `scale(1.08) translate3d(0, ${offset}px, 0)`;
}

function handleScroll() {
  updateHeaderState();
  updateParallax();
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    toggleMenu(false);
  }
  updateParallax();
});

updateHeaderState();
updateParallax();
