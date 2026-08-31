const { layout } = require("./layout");

function renderNewSite(flash) {
  const body = `
    <div class="card">
      <h1>New display site</h1>
      <form method="post" action="/sites">
        <label>Slug (ID) - lowercase letters, numbers and hyphens only</label>
        <input type="text" name="slug" placeholder="lobby-north" pattern="[a-z0-9][a-z0-9-]*" required>

        <label>Display name</label>
        <input type="text" name="name" placeholder="Main School - Front Entrance" required>

        <label>Screen orientation</label>
        <select name="orientation">
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>

        <div class="checkbox-row">
          <input type="checkbox" name="rotateViaCss" id="rotateViaCss">
          <label for="rotateViaCss" style="margin:0;">TV doesn't rotate on its own - rotate the content with CSS</label>
        </div>

        <div class="checkbox-row">
          <input type="checkbox" name="tickerEnabled" id="tickerEnabled" checked>
          <label for="tickerEnabled" style="margin:0;">Show the ticker (unchecked = no ticker bar at all, image fills the screen)</label>
        </div>

        <label>Ticker entrance direction</label>
        <select name="tickerDirection">
          <option value="ltr">From the left</option>
          <option value="rtl">From the right</option>
        </select>

        <label>Ticker speed (seconds per pass - lower is faster)</label>
        <input type="number" name="tickerSpeedSec" value="30" min="5" max="120">

        <label>Ticker text size (% of ticker bar height)</label>
        <input type="number" name="tickerSizePercent" value="80" min="20" max="150">

        <label>Carousel speed (seconds)</label>
        <input type="number" name="carouselIntervalSec" value="8" min="2">

        <div class="checkbox-row">
          <input type="checkbox" name="qrEnabled" id="qrEnabled" checked>
          <label for="qrEnabled" style="margin:0;">Show the QR code</label>
        </div>

        <label>QR target (website/form URL)</label>
        <input type="url" name="qrTarget" placeholder="https://forms.gle/...">

        <button type="submit">Create site</button>
        <a class="btn secondary" href="/">Cancel</a>
      </form>
    </div>
  `;
  return layout({ title: "New site", body, flash });
}

module.exports = { renderNewSite };
