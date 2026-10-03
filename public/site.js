(() => {
  "use strict";
  const carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll("[data-slide]"));
    const dots = Array.from(carousel.querySelectorAll("[data-slide-to]"));
    const track = carousel.querySelector("[data-carousel-track]");
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const status = carousel.querySelector("[data-carousel-status]");
    let current = 0;
    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((slide, i) => {
        slide.setAttribute("aria-hidden", String(i !== current));
        slide.inert = i !== current;
      });
      dots.forEach((dot, i) => {
        if (i === current) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      status.textContent = `Screenshot ${current + 1} of ${slides.length}`;
    }
    carousel.querySelector("[data-carousel-previous]").addEventListener("click", () => showSlide(current - 1));
    carousel.querySelector("[data-carousel-next]").addEventListener("click", () => showSlide(current + 1));
    dots.forEach((dot) => dot.addEventListener("click", () => showSlide(Number(dot.dataset.slideTo))));
    carousel.addEventListener("keydown", (event) => {
      const moves = { ArrowLeft: -1, ArrowRight: 1 };
      if (event.key in moves) {
        event.preventDefault();
        showSlide(current + moves[event.key]);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        showSlide(event.key === "Home" ? 0 : slides.length - 1);
      }
    });
    let touchStart = null;
    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") return;
      touchStart = { x: event.clientX, y: event.clientY };
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointerup", (event) => {
      if (!touchStart) return;
      const dx = event.clientX - touchStart.x;
      const dy = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        showSlide(current + (dx < 0 ? 1 : -1));
      }
    });
    viewport.addEventListener("pointercancel", () => { touchStart = null; });
  }
  // The stable release download works even if this optional metadata request fails.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  fetch("https://api.github.com/repos/masalaempire/OnTimely/releases/latest", {
    signal: controller.signal, headers: { Accept: "application/vnd.github+json" }
  }).then((response) => {
    if (!response.ok) throw new Error("Release metadata unavailable");
    return response.json();
  }).then((release) => {
    const asset = Array.isArray(release.assets) && release.assets.find((item) =>
      item.name === "OnTimely.dmg" &&
      typeof item.browser_download_url === "string" &&
      item.browser_download_url.startsWith("https://github.com/masalaempire/OnTimely/releases/download/")
    );
    if (!asset || typeof release.tag_name !== "string" || !/^v?\d[\w.\-+]*$/.test(release.tag_name)) {
      throw new Error("Release metadata incomplete");
    }
    document.querySelectorAll("[data-release]").forEach((label) => {
      label.textContent = "Version " + release.tag_name.replace(/^v/, "");
    });
  }).catch(() => {
    document.querySelectorAll("[data-release]").forEach((label) => { label.textContent = "Latest on GitHub"; });
  }).finally(() => clearTimeout(timeout));
})();
