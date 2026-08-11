const { layout, escapeHtml } = require("./layout");

function renderEdit(site, flash) {
  const slug = encodeURIComponent(site.slug);

  const imageItems = site.images
    .map(
      (img, i) => `<li>
        <img src="/site-images/${slug}/images/${encodeURIComponent(img)}" alt="">
        <span class="name">${escapeHtml(img)}</span>
        <span class="row-actions">
          <form class="inline" method="post" action="/sites/${slug}/images/${encodeURIComponent(img)}/move">
            <input type="hidden" name="direction" value="up">
            <button class="secondary" type="submit" ${i === 0 ? "disabled" : ""}>&uarr;</button>
          </form>
          <form class="inline" method="post" action="/sites/${slug}/images/${encodeURIComponent(img)}/move">
            <input type="hidden" name="direction" value="down">
            <button class="secondary" type="submit" ${i === site.images.length - 1 ? "disabled" : ""}>&darr;</button>
          </form>
          <form class="inline" method="post" action="/sites/${slug}/images/${encodeURIComponent(img)}/delete" onsubmit="return confirm('Delete this image?');">
            <button class="danger" type="submit">Delete</button>
          </form>
        </span>
      </li>`
    )
    .join("");

  const body = `
    <div class="card">
      <h1>${escapeHtml(site.name)}</h1>
      <p class="muted">Live display URL (after publishing): <code>/${escapeHtml(site.slug)}/</code></p>

      <form method="post" action="/sites/${slug}">
        <label>Display name</label>
        <input type="text" name="name" value="${escapeHtml(site.name)}" required>

        <label>Screen orientation</label>
        <select name="orientation">
          <option value="landscape" ${site.orientation === "landscape" ? "selected" : ""}>Landscape</option>
          <option value="portrait" ${site.orientation === "portrait" ? "selected" : ""}>Portrait</option>
        </select>

        <div class="checkbox-row">
          <input type="checkbox" name="rotateViaCss" id="rotateViaCss" ${site.rotateViaCss ? "checked" : ""}>
          <label for="rotateViaCss" style="margin:0;">TV doesn't rotate on its own - rotate the content with CSS</label>
        </div>

        <label>Ticker entrance direction</label>
        <select name="tickerDirection">
          <option value="ltr" ${site.tickerDirection !== "rtl" ? "selected" : ""}>From the left</option>
          <option value="rtl" ${site.tickerDirection === "rtl" ? "selected" : ""}>From the right</option>
        </select>

        <label>Ticker speed (seconds per pass - lower is faster)</label>
        <input type="number" name="tickerSpeedSec" value="${site.tickerSpeedSec}" min="5" max="120">

        <label>Ticker text size (% of ticker bar height)</label>
        <input type="number" name="tickerSizePercent" value="${site.tickerSizePercent}" min="20" max="150">

        <label>Carousel speed (seconds)</label>
        <input type="number" name="carouselIntervalSec" value="${site.carouselIntervalSec}" min="2">

        <label>QR target (website/form URL)</label>
        <input type="url" name="qrTarget" value="${escapeHtml(site.qrTarget)}" placeholder="https://forms.gle/...">

        <button type="submit">Save settings</button>
      </form>
    </div>

    <div class="card">
      <h2>Ticker text</h2>
      <form method="post" action="/sites/${slug}/ticker">
        <label>One line of text per row</label>
        <textarea name="ticker">${escapeHtml(site.ticker.join("\n"))}</textarea>
        <button type="submit">Save ticker</button>
      </form>
    </div>

    <div class="card">
      <h2>Carousel images</h2>
      <ul class="image-list">${imageItems || '<li class="muted">No images yet</li>'}</ul>
      <form method="post" action="/sites/${slug}/images" enctype="multipart/form-data">
        <label>Add image</label>
        <input type="file" name="image" accept="image/*" required>
        <button type="submit">Upload</button>
      </form>
    </div>

    <div class="card">
      <h2>Publish</h2>
      <p class="muted">"Build only" generates the static site files locally. "Build & publish" builds, then sends (git commit + push) to the repo - that's what actually updates what the TVs show.</p>
      <form method="post" action="/build">
        <button class="secondary" type="submit">Build only</button>
      </form>
      <form method="post" action="/publish" onsubmit="return confirm('Publish these changes? This will run git commit + push to the linked repo.');">
        <button type="submit">Build &amp; publish</button>
      </form>
    </div>

    <div class="card">
      <h2>Delete site</h2>
      <form method="post" action="/sites/${slug}/delete" onsubmit="return confirm('Permanently delete the site ${escapeHtml(site.name)} and all of its images?');">
        <button class="danger" type="submit">Delete site</button>
      </form>
    </div>
  `;
  return layout({ title: site.name, body, flash });
}

module.exports = { renderEdit };
