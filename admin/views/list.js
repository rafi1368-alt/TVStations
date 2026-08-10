const { layout, escapeHtml } = require("./layout");

function renderList(sites, flash) {
  const rows = sites
    .map(
      (s) => `<tr>
        <td><a href="/sites/${encodeURIComponent(s.slug)}">${escapeHtml(s.name)}</a><div class="muted">${escapeHtml(s.slug)}</div></td>
        <td>${s.orientation === "portrait" ? "אנכי" : "אופקי"}</td>
        <td>${s.images.length}</td>
        <td>${s.ticker.length}</td>
      </tr>`
    )
    .join("");

  const body = `
    <div class="card">
      <h1>אתרי תצוגה</h1>
      ${sites.length ? `<table><thead><tr><th>שם</th><th>כיוון</th><th>תמונות</th><th>שורות טיקר</th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="muted">אין עדיין אתרי תצוגה. צור אחד למטה.</p>`}
      <a class="btn" href="/sites/new">+ אתר חדש</a>
      <form class="inline" method="post" action="/build">
        <button class="secondary" type="submit">בנה מחדש (build)</button>
      </form>
    </div>
  `;

  return layout({ title: "אתרים", body, flash });
}

module.exports = { renderList };
