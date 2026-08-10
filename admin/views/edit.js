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
          <form class="inline" method="post" action="/sites/${slug}/images/${encodeURIComponent(img)}/delete" onsubmit="return confirm('למחוק את התמונה?');">
            <button class="danger" type="submit">מחק</button>
          </form>
        </span>
      </li>`
    )
    .join("");

  const body = `
    <div class="card">
      <h1>${escapeHtml(site.name)}</h1>
      <p class="muted">כתובת תצוגה חיה (אחרי פרסום): <code>/${escapeHtml(site.slug)}/</code></p>

      <form method="post" action="/sites/${slug}">
        <label>שם תצוגה</label>
        <input type="text" name="name" value="${escapeHtml(site.name)}" required>

        <label>כיוון מסך</label>
        <select name="orientation">
          <option value="landscape" ${site.orientation === "landscape" ? "selected" : ""}>אופקי (Landscape)</option>
          <option value="portrait" ${site.orientation === "portrait" ? "selected" : ""}>אנכי (Portrait)</option>
        </select>

        <div class="checkbox-row">
          <input type="checkbox" name="rotateViaCss" id="rotateViaCss" ${site.rotateViaCss ? "checked" : ""}>
          <label for="rotateViaCss" style="margin:0;">הטלוויזיה לא מסתובבת לבד - סובב את התוכן ב-CSS</label>
        </div>

        <label>קצב קרוסלה (שניות)</label>
        <input type="number" name="carouselIntervalSec" value="${site.carouselIntervalSec}" min="2">

        <label>יעד QR (כתובת אתר/טופס)</label>
        <input type="url" name="qrTarget" value="${escapeHtml(site.qrTarget)}" placeholder="https://forms.gle/...">

        <button type="submit">שמור הגדרות</button>
      </form>
    </div>

    <div class="card">
      <h2>טקסט רץ (טיקר)</h2>
      <form method="post" action="/sites/${slug}/ticker">
        <label>שורה אחת בכל שורת טקסט</label>
        <textarea name="ticker">${escapeHtml(site.ticker.join("\n"))}</textarea>
        <button type="submit">שמור טיקר</button>
      </form>
    </div>

    <div class="card">
      <h2>תמונות קרוסלה</h2>
      <ul class="image-list">${imageItems || '<li class="muted">אין עדיין תמונות</li>'}</ul>
      <form method="post" action="/sites/${slug}/images" enctype="multipart/form-data">
        <label>הוסף תמונה</label>
        <input type="file" name="image" accept="image/*" required>
        <button type="submit">העלה</button>
      </form>
    </div>

    <div class="card">
      <h2>פרסום</h2>
      <p class="muted">"בנה" מייצר את קבצי האתר הסטטיים מקומית. "פרסם" בונה, ואז שולח (git commit + push) לריפו - זה מה שמעדכן את מה שהטלוויזיות רואות בפועל.</p>
      <form method="post" action="/build">
        <button class="secondary" type="submit">בנה בלבד</button>
      </form>
      <form method="post" action="/publish" onsubmit="return confirm('לפרסם את השינויים? זה יריץ git commit + push לריפו המקושר.');">
        <button type="submit">בנה ופרסם</button>
      </form>
    </div>

    <div class="card">
      <h2>מחיקת אתר</h2>
      <form method="post" action="/sites/${slug}/delete" onsubmit="return confirm('למחוק לצמיתות את האתר ${escapeHtml(site.name)} וכל התמונות שלו?');">
        <button class="danger" type="submit">מחק אתר</button>
      </form>
    </div>
  `;
  return layout({ title: site.name, body, flash });
}

module.exports = { renderEdit };
