(function () {
  var SITE = window.__SITE__ || {};

  function startCarousel() {
    var slides = document.querySelectorAll(".slide");
    if (slides.length < 2) return;
    var current = 0;
    var intervalMs = (SITE.carouselIntervalSec || 8) * 1000;
    setInterval(function () {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, intervalMs);
  }

  function startTicker() {
    var track = document.getElementById("tickerTrack");
    if (!track || !track.children.length) return;
    // Duplicate the content once so the loop has no visible seam.
    track.innerHTML += track.innerHTML;
  }

  function startAutoRefresh() {
    var CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
    var HARD_REFRESH_MS = 24 * 60 * 60 * 1000; // safety net: reload once a day regardless

    setTimeout(function () {
      window.location.reload();
    }, HARD_REFRESH_MS);

    setInterval(function () {
      fetch("version.json?t=" + Date.now(), { cache: "no-store" })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.buildTime && data.buildTime !== SITE.buildTime) {
            window.location.reload();
          }
        })
        .catch(function () {
          // Network hiccup - just try again on the next interval.
        });
    }, CHECK_INTERVAL_MS);
  }

  startCarousel();
  startTicker();
  startAutoRefresh();
})();
