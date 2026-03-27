const header = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const currentYear = document.getElementById("currentYear");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
const sections = [...document.querySelectorAll("main section[id]")];
const parallaxMedia = document.getElementById("parallaxMedia");
const countdownRoot = document.getElementById("jayantiCountdown");
const dayEl = document.getElementById("countDays");
const hourEl = document.getElementById("countHours");
const minuteEl = document.getElementById("countMinutes");
const playMantra = document.getElementById("playMantra");
const stopMantra = document.getElementById("stopMantra");
const audioStatus = document.getElementById("audioStatus");
const tiltCards = document.querySelectorAll(".tilt-card");
const magneticButtons = document.querySelectorAll(".magnetic");

const mantraText = [
  "Namo Arihantanam.",
  "Namo Siddhanam.",
  "Namo Ayariyanam.",
  "Namo Uvajjhayanam.",
  "Namo Loe Savva Sahunam.",
  "Eso Pancha Namokkaro, Savva Pavappanasano."
].join(" ");

let mantraUtterance;
let mantraSpeaking = false;

currentYear.textContent = new Date().getFullYear();

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

function updateCountdown() {
  if (!countdownRoot) return;

  const target = new Date(countdownRoot.dataset.target);
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) {
    dayEl.textContent = "00";
    hourEl.textContent = "00";
    minuteEl.textContent = "00";
    return;
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  dayEl.textContent = String(days).padStart(2, "0");
  hourEl.textContent = String(hours).padStart(2, "0");
  minuteEl.textContent = String(minutes).padStart(2, "0");
}

function resetTilt(card) {
  card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
}

tiltCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    if (window.innerWidth < 900) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    const rotateX = (0.5 - (y / rect.height)) * 8;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener("mouseleave", () => resetTilt(card));
});

magneticButtons.forEach((button) => {
  button.addEventListener("mousemove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "translate(0, 0)";
  });
});

function stopMantraAudio() {
  if (!window.speechSynthesis) {
    audioStatus.textContent = "Speech playback is not supported in this browser.";
    return;
  }

  window.speechSynthesis.cancel();
  mantraSpeaking = false;
  audioStatus.textContent = "Playback stopped";
}

function playMantraAudio() {
  if (!window.speechSynthesis) {
    audioStatus.textContent = "Speech playback is not supported in this browser.";
    return;
  }

  window.speechSynthesis.cancel();
  mantraUtterance = new SpeechSynthesisUtterance(mantraText);
  mantraUtterance.rate = 0.8;
  mantraUtterance.pitch = 1;
  mantraUtterance.volume = 1;
  mantraUtterance.lang = "hi-IN";

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => voice.lang === "hi-IN") || voices.find((voice) => voice.lang.startsWith("en"));
  if (preferredVoice) {
    mantraUtterance.voice = preferredVoice;
  }

  mantraUtterance.onstart = () => {
    mantraSpeaking = true;
    audioStatus.textContent = "Playing Namokar Mantra";
  };

  mantraUtterance.onend = () => {
    mantraSpeaking = false;
    audioStatus.textContent = "Playback finished";
  };

  mantraUtterance.onerror = () => {
    mantraSpeaking = false;
    audioStatus.textContent = "Unable to play in this browser";
  };

  window.speechSynthesis.speak(mantraUtterance);
}

if (playMantra) {
  playMantra.addEventListener("click", () => {
    if (mantraSpeaking) {
      stopMantraAudio();
      return;
    }
    playMantraAudio();
  });
}

if (stopMantra) {
  stopMantra.addEventListener("click", stopMantraAudio);
}

window.speechSynthesis?.addEventListener?.("voiceschanged", () => {});
window.addEventListener("beforeunload", stopMantraAudio);

function handleScroll() {
  updateHeaderState();
  updateParallax();
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    toggleMenu(false);
  }
  tiltCards.forEach((card) => resetTilt(card));
  magneticButtons.forEach((button) => {
    button.style.transform = "translate(0, 0)";
  });
  updateParallax();
});

updateHeaderState();
updateParallax();
updateCountdown();
setInterval(updateCountdown, 60000);
