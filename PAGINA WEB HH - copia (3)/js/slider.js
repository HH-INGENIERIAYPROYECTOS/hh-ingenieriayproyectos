document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".banner-slider");
  if (!slider) return;

  const track = slider.querySelector(".slider-track");
  const prevBtn = slider.querySelector(".prev");
  const nextBtn = slider.querySelector(".next");
  const dots = Array.from(slider.querySelectorAll(".dot"));

  let slides = Array.from(track.querySelectorAll(".slide"));
  const total = slides.length;
  if (!total) return;

  // ---------- 1) CLONES PARA LOOP INFINITO ----------
  const firstClone = slides[0].cloneNode(true);
  const lastClone  = slides[total - 1].cloneNode(true);
  firstClone.classList.add("clone");
  lastClone.classList.add("clone");

  track.insertBefore(lastClone, slides[0]);
  track.appendChild(firstClone);

  slides = Array.from(track.querySelectorAll(".slide")); // ahora incluye clones

  // Index real (0..total-1) y index de track (1..total)
  let trackIndex = 1; // empezamos en el primer real (porque 0 es clone de la última)
  let isTransitioning = false;

  // ---------- 2) AUTO ----------
  const intervalMs = 5000;
  let autoSlide = null;
  function startAuto() {
    stopAuto();
    autoSlide = setInterval(() => next(), intervalMs);
  }
  function stopAuto() {
    if (autoSlide) clearInterval(autoSlide);
    autoSlide = null;
  }

  // ---------- 3) RENDER / MOVE ----------
  function setActiveDot() {
    if (!dots.length) return;
    const realIndex = (trackIndex - 1 + total) % total; // mapeo a real
    dots.forEach((d, i) => d.classList.toggle("active", i === realIndex));
  }

  function goToTrackIndex(index, { animate = true } = {}) {
    const width = slider.clientWidth;
    if (!animate) track.style.transition = "none";
    else track.style.transition = "transform .45s ease";

    track.style.transform = `translateX(${-index * width}px)`;
    trackIndex = index;
    setActiveDot();
  }

  function next() {
    if (isTransitioning) return;
    isTransitioning = true;
    goToTrackIndex(trackIndex + 1, { animate: true });
  }

  function prev() {
    if (isTransitioning) return;
    isTransitioning = true;
    goToTrackIndex(trackIndex - 1, { animate: true });
  }

  // Cuando termina la transición, si estamos en un clone, “saltamos” sin animación
  track.addEventListener("transitionend", () => {
    isTransitioning = false;

    // Si llegamos al clone del final (que es la primera al final)
    if (trackIndex === total + 1) {
      // saltar al primer real
      goToTrackIndex(1, { animate: false });
    }

    // Si llegamos al clone del inicio (que es la última al inicio)
    if (trackIndex === 0) {
      // saltar al último real
      goToTrackIndex(total, { animate: false });
    }
  });

  // ---------- 4) FLECHAS (CLICK) ----------
  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    prev();
    startAuto();
  });

  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    next();
    startAuto();
  });

  // ---------- 5) DOTS ----------
  dots.forEach((dot, i) => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      // trackIndex real = i + 1 (por clone al inicio)
      goToTrackIndex(i + 1, { animate: true });
      startAuto();
    });
  });

  // ---------- 6) DRAG (MOUSE + TOUCH) ----------
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  const DRAG_THRESHOLD = 80;

  slider.addEventListener("pointerdown", (e) => {
    // IMPORTANTE: no iniciar drag si el usuario clickea flechas o dots
    if (e.target.closest(".slider-btn") || e.target.closest(".dot")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    stopAuto();
    isDragging = true;
    slider.classList.add("is-dragging");

    startX = e.clientX;

    // base translate actual
    const width = slider.clientWidth;
    prevTranslate = -trackIndex * width;
    currentTranslate = prevTranslate;

    slider.setPointerCapture(e.pointerId);
  });

  slider.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    currentTranslate = prevTranslate + dx;
    track.style.transform = `translateX(${currentTranslate}px)`;
  });

  slider.addEventListener("pointerup", () => {
    if (!isDragging) return;
    isDragging = false;
    slider.classList.remove("is-dragging");

    const movedBy = currentTranslate - prevTranslate;

    if (movedBy < -DRAG_THRESHOLD) next();
    else if (movedBy > DRAG_THRESHOLD) prev();
    else goToTrackIndex(trackIndex, { animate: true });

    startAuto();
  });

  slider.addEventListener("pointercancel", () => {
    isDragging = false;
    slider.classList.remove("is-dragging");
    goToTrackIndex(trackIndex, { animate: true });
    startAuto();
  });

  // ---------- 7) PAUSA HOVER ----------
  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);

  // ---------- 8) RESIZE ----------
  window.addEventListener("resize", () => {
    goToTrackIndex(trackIndex, { animate: false });
  });

  // ---------- INIT ----------
  goToTrackIndex(1, { animate: false }); // primer real
  startAuto();
});