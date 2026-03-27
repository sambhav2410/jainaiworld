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
const mantraAudio = document.getElementById("mantraAudioElement");
const timelineSlider = document.getElementById("timelineSlider");
const currentTimeEl = document.getElementById("currentTime");
const durationTimeEl = document.getElementById("durationTime");
const volumeSlider = document.getElementById("volumeSlider");
const repeatButtons = document.querySelectorAll(".repeat-chip");
const mantraCards = [...document.querySelectorAll("[data-mantra-index]")];
const tiltCards = document.querySelectorAll(".tilt-card");
const magneticButtons = document.querySelectorAll(".magnetic");
const addJap = document.getElementById("addJap");
const resetJap = document.getElementById("resetJap");
const japCount = document.getElementById("japCount");
const japStatus = document.getElementById("japStatus");
const japRingFill = document.getElementById("japRingFill");
const waveformCanvas = document.getElementById("waveformCanvas");
const waveformContext = waveformCanvas?.getContext("2d");

let selectedRepeat = 1;
let completedCycles = 0;
let japValue = 0;
let isScrubbing = false;
let audioContext = null;
let analyser = null;
let sourceNode = null;
let waveformData = null;
let waveformFrame = 0;
const japCircumference = 2 * Math.PI * 48;

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (japRingFill) {
  japRingFill.style.strokeDasharray = `${japCircumference}`;
  japRingFill.style.strokeDashoffset = `${japCircumference}`;
}

function updateHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

function toggleMenu(forceOpen) {
  if (!siteNav || !menuToggle) return;

  const shouldOpen =
    typeof forceOpen === "boolean" ? forceOpen : !siteNav.classList.contains("is-open");

  siteNav.classList.toggle("is-open", shouldOpen);
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
}

menuToggle?.addEventListener("click", () => toggleMenu());

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
    siteNav &&
    menuToggle &&
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
  { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
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
  { threshold: 0.45, rootMargin: "-15% 0px -35% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));

function updateParallax() {
  if (!parallaxMedia?.parentElement) return;

  const rect = parallaxMedia.parentElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = (clamped - 0.5) * 50;

  parallaxMedia.style.transform = `scale(1.08) translate3d(0, ${offset}px, 0)`;
}

function updateCountdown() {
  if (!countdownRoot || !dayEl || !hourEl || !minuteEl) return;

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

function clearActiveMantra() {
  mantraCards.forEach((card) => card.classList.remove("is-active"));
}

function setActiveMantra(index) {
  clearActiveMantra();
  const target = mantraCards[index];
  if (target) target.classList.add("is-active");
}

function syncActiveMantra() {
  if (!mantraAudio || !mantraAudio.duration || mantraAudio.currentTime <= 0) {
    clearActiveMantra();
    return;
  }

  const progress = mantraAudio.currentTime / mantraAudio.duration;
  const index = Math.min(mantraCards.length - 1, Math.floor(progress * mantraCards.length));
  setActiveMantra(index);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function setRangeProgress(input) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const ratio = max > min ? ((value - min) / (max - min)) * 100 : 0;
  input.style.setProperty("--range-progress", `${ratio}%`);
}

function updateAudioStatus(message) {
  if (audioStatus) {
    audioStatus.textContent = message;
  }
}

function updatePlayStateUI(isPlaying) {
  playMantra?.classList.toggle("is-playing", isPlaying);
}

function updateAudioUI() {
  if (!mantraAudio) return;

  if (timelineSlider && !isScrubbing) {
    const progress = mantraAudio.duration ? (mantraAudio.currentTime / mantraAudio.duration) * 100 : 0;
    timelineSlider.value = String(progress);
    setRangeProgress(timelineSlider);
  }

  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(mantraAudio.currentTime);
  }

  if (durationTimeEl) {
    durationTimeEl.textContent = formatTime(mantraAudio.duration);
  }

  syncActiveMantra();
}

function setupAudioGraph() {
  if (!mantraAudio || audioContext || !waveformCanvas) return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  audioContext = new AudioCtor();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.86;
  waveformData = new Uint8Array(analyser.frequencyBinCount);
  sourceNode = audioContext.createMediaElementSource(mantraAudio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
}

function resizeWaveformCanvas() {
  if (!waveformCanvas || !waveformContext) return;

  const rect = waveformCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  waveformCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  waveformCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  waveformContext.setTransform(1, 0, 0, 1, 0, 0);
  waveformContext.scale(dpr, dpr);
}

function drawWaveform() {
  if (!waveformCanvas || !waveformContext) return;

  const { width, height } = waveformCanvas.getBoundingClientRect();
  if (!width || !height) return;

  waveformContext.clearRect(0, 0, width, height);

  const barCount = 56;
  const gap = 4;
  const barWidth = Math.max(3, (width - gap * (barCount - 1)) / barCount);
  const centerY = height / 2;
  const baseHeight = Math.max(10, height * 0.12);
  const isLive = Boolean(analyser && waveformData && !mantraAudio?.paused);

  if (isLive) {
    analyser.getByteFrequencyData(waveformData);
  }

  for (let index = 0; index < barCount; index += 1) {
    const x = index * (barWidth + gap);
    let intensity;

    if (isLive) {
      const sourceIndex = Math.min(waveformData.length - 1, Math.floor((index / barCount) * waveformData.length));
      intensity = waveformData[sourceIndex] / 255;
    } else {
      intensity = 0.18 + Math.abs(Math.sin((Date.now() / 900) + index * 0.42)) * 0.16;
    }

    const barHeight = baseHeight + intensity * height * 0.42;
    const y = centerY - barHeight / 2;
    const gradient = waveformContext.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, "rgba(255, 240, 209, 0.18)");
    gradient.addColorStop(0.5, index % 2 === 0 ? "rgba(255, 170, 31, 0.95)" : "rgba(255, 211, 122, 0.95)");
    gradient.addColorStop(1, "rgba(255, 240, 209, 0.22)");

    waveformContext.fillStyle = gradient;
    if (typeof waveformContext.roundRect === "function") {
      waveformContext.beginPath();
      waveformContext.roundRect(x, y, barWidth, barHeight, 999);
      waveformContext.fill();
    } else {
      waveformContext.fillRect(x, y, barWidth, barHeight);
    }
  }

  waveformContext.fillStyle = "rgba(255, 228, 170, 0.18)";
  waveformContext.fillRect(0, centerY - 1, width, 2);

  waveformFrame = window.requestAnimationFrame(drawWaveform);
}

function ensureWaveformLoop() {
  if (waveformFrame) return;
  resizeWaveformCanvas();
  drawWaveform();
}

function startPlayback() {
  if (!mantraAudio) return;

  setupAudioGraph();
  ensureWaveformLoop();

  if (audioContext?.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  if (mantraAudio.ended || mantraAudio.currentTime >= (mantraAudio.duration || 0)) {
    mantraAudio.currentTime = 0;
    completedCycles = 0;
  }

  if (mantraAudio.currentTime === 0) {
    completedCycles = 0;
  }

  mantraAudio.play().catch(() => {
    updateAudioStatus("Unable to start playback in this browser.");
  });
}

function stopMantraAudio() {
  if (!mantraAudio) return;

  mantraAudio.pause();
  mantraAudio.currentTime = 0;
  completedCycles = 0;
  clearActiveMantra();
  updateAudioUI();
  updatePlayStateUI(false);
  updateAudioStatus("Playback stopped");
}

repeatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedRepeat = Number(button.dataset.repeat || "1");
    repeatButtons.forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");

    const currentCycle = Math.min(completedCycles + 1, selectedRepeat);
    updateAudioStatus(`Repeat mode set to ${selectedRepeat}x${mantraAudio?.paused ? "" : ` · cycle ${currentCycle} of ${selectedRepeat}`}`);
  });
});

playMantra?.addEventListener("click", () => {
  if (!mantraAudio) return;

  if (mantraAudio.paused) {
    startPlayback();
  } else {
    mantraAudio.pause();
  }
});

stopMantra?.addEventListener("click", stopMantraAudio);

mantraAudio?.addEventListener("loadedmetadata", () => {
  updateAudioUI();
  updateAudioStatus("Ready to play Namokar Mantra");
});

mantraAudio?.addEventListener("canplay", () => {
  updateAudioUI();
  updateAudioStatus("Ready to play Namokar Mantra");
});

mantraAudio?.addEventListener("play", () => {
  updatePlayStateUI(true);
  const cycle = Math.min(completedCycles + 1, selectedRepeat);
  updateAudioStatus(`Playing cycle ${cycle} of ${selectedRepeat}`);
});

mantraAudio?.addEventListener("pause", () => {
  updatePlayStateUI(false);
  if (mantraAudio.ended || mantraAudio.currentTime === 0) return;
  updateAudioStatus(`Paused at ${formatTime(mantraAudio.currentTime)}`);
});

mantraAudio?.addEventListener("timeupdate", updateAudioUI);

mantraAudio?.addEventListener("ended", () => {
  completedCycles += 1;

  if (completedCycles < selectedRepeat) {
    mantraAudio.currentTime = 0;
    updateAudioStatus(`Playing cycle ${completedCycles + 1} of ${selectedRepeat}`);
    mantraAudio.play().catch(() => {
      updateAudioStatus("Unable to continue playback in this browser.");
    });
    return;
  }

  completedCycles = 0;
  clearActiveMantra();
  updatePlayStateUI(false);
  updateAudioStatus("Playback finished");
});

mantraAudio?.addEventListener("error", () => {
  updatePlayStateUI(false);
  updateAudioStatus("The mantra audio could not be loaded.");
});

timelineSlider?.addEventListener("input", () => {
  if (!mantraAudio) return;
  isScrubbing = true;
  setRangeProgress(timelineSlider);

  const previewTime = mantraAudio.duration ? (Number(timelineSlider.value) / 100) * mantraAudio.duration : 0;
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(previewTime);
  }
});

timelineSlider?.addEventListener("change", () => {
  if (!mantraAudio) return;
  const nextTime = mantraAudio.duration ? (Number(timelineSlider.value) / 100) * mantraAudio.duration : 0;
  mantraAudio.currentTime = nextTime;
  isScrubbing = false;
  updateAudioUI();
});

volumeSlider?.addEventListener("input", () => {
  if (!mantraAudio) return;
  mantraAudio.volume = Number(volumeSlider.value);
  setRangeProgress(volumeSlider);
  updateAudioStatus(`Volume ${Math.round(Number(volumeSlider.value) * 100)}%`);
});

if (mantraAudio && volumeSlider) {
  mantraAudio.volume = Number(volumeSlider.value);
}

setRangeProgress(timelineSlider);
setRangeProgress(volumeSlider);

function updateJapCounter() {
  if (japCount) {
    japCount.textContent = String(japValue);
  }

  const progress = japValue / 108;
  const offset = japCircumference - japCircumference * progress;
  if (japRingFill) japRingFill.style.strokeDashoffset = `${offset}`;

  if (!japStatus) return;

  if (japValue === 0) {
    japStatus.textContent = "Begin your mala";
  } else if (japValue < 108) {
    japStatus.textContent = `${108 - japValue} beads remaining`;
  } else {
    japStatus.textContent = "108 complete. Micchami Dukkadam.";
  }
}

addJap?.addEventListener("click", () => {
  japValue = Math.min(108, japValue + 1);
  updateJapCounter();
});

resetJap?.addEventListener("click", () => {
  japValue = 0;
  updateJapCounter();
});

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

  resizeWaveformCanvas();
  updateParallax();
});

window.addEventListener("beforeunload", () => {
  mantraAudio?.pause();
  if (waveformFrame) {
    cancelAnimationFrame(waveformFrame);
  }
});

updateHeaderState();
updateParallax();
updateCountdown();
updateJapCounter();
updateAudioUI();
resizeWaveformCanvas();
ensureWaveformLoop();
setInterval(updateCountdown, 60000);

