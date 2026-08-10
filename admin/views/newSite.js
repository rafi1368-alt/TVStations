const { layout } = require("./layout");

function renderNewSite(flash) {
  const body = `
    <div class="card">
      <h1>אתר תצוגה חדש</h1>
      <form method="post" action="/sites">
        <label>מזהה (slug) - אנגלית, מספרים ומקפים בלבד</label>
        <input type="text" name="slug" placeholder="lobby-north" pattern="[a-z0-9][a-z0-9-]*" required>

        <label>שם תצוגה</label>
        <input type="text" name="name" placeholder="בית ספר א' - כניסה ראשית" required>

        <label>כיוון מסך</label>
        <select name="orientation">
          <option value="landscape">אופקי (Landscape)</option>
          <option value="portrait">אנכי (Portrait)</option>
        </select>

        <div class="checkbox-row">
          <input type="checkbox" name="rotateViaCss" id="rotateViaCss">
          <label for="rotateViaCss" style="margin:0;">הטלוויזיה לא מסתובבת לבד - סובב את התוכן ב-CSS</label>
        </div>

        <label>קצב קרוסלה (שניות)</label>
        <input type="number" name="carouselIntervalSec" value="8" min="2">

        <label>יעד QR (כתובת אתר/טופס)</label>
        <input type="url" name="qrTarget" placeholder="https://forms.gle/...">

        <button type="submit">צור אתר</button>
        <a class="btn secondary" href="/">ביטול</a>
      </form>
    </div>
  `;
  return layout({ title: "אתר חדש", body, flash });
}

module.exports = { renderNewSite };
