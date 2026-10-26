(function () {
  var SITE = window.__SITE__ || {};

  // How often the screen looks for a newly published version.
  var CHECK_INTERVAL_MS = 60 * 1000;
  // Safety net: reload this often even if nothing changed, so a TV browser
  // that has been running for days with big images starts clean.
  var HARD_REFRESH_MS = 6 * 60 * 60 * 1000;
  // If the network is down when the safety-net reload is due, retry later.
  var RETRY_MS = 5 * 60 * 1000;

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

  // XMLHttpRequest rather than fetch(): older smart-TV browsers have no fetch,
  // and the auto-refresh would silently never run there.
  // done(buildTime) gets the published build time, or null if unreachable.
  function fetchPublishedVersion(done) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/" + SITE.slug + "/version.json?t=" + Date.now(), true);
      xhr.timeout = 15000;
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        var buildTime = null;
        if (xhr.status === 200) {
          try { buildTime = JSON.parse(xhr.responseText).buildTime || null; } catch (e) {}
        }
        done(buildTime);
      };
      xhr.send();
    } catch (e) {
      done(null);
    }
  }

  // A fresh URL each time defeats TV browsers that hold on to the old page.
  function reloadNow() {
    window.location.replace(window.location.pathname + "?v=" + Date.now());
  }

  function checkForUpdate() {
    fetchPublishedVersion(function (buildTime) {
      if (buildTime && SITE.buildTime && buildTime !== SITE.buildTime) {
        reloadNow();
      }
    });
  }

  function hardRefresh() {
    // Only reload while the network is reachable - reloading offline would
    // leave the TV stuck on a browser error page with no script to recover.
    fetchPublishedVersion(function (buildTime) {
      if (buildTime) reloadNow();
      else setTimeout(hardRefresh, RETRY_MS);
    });
  }

  function startAutoRefresh() {
    setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    setTimeout(hardRefresh, HARD_REFRESH_MS);
    // Catch up straight away when the network comes back or the screen wakes.
    window.addEventListener("online", checkForUpdate);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) checkForUpdate();
    });
  }

  // Each piece is isolated and the refresh is armed first, so a problem in the
  // carousel or ticker can never stop the screen from updating itself.
  [startAutoRefresh, startCarousel, startTicker].forEach(function (start) {
    try { start(); } catch (e) {}
  });
})();
