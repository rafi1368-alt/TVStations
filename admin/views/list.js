const { layout, escapeHtml } = require("./layout");

function renderList(sites, flash) {
  const rows = sites
    .map(
      (s) => `<tr>
        <td><a href="/sites/${encodeURIComponent(s.slug)}">${escapeHtml(s.name)}</a><div class="muted">${escapeHtml(s.slug)}</div></td>
        <td>${s.orientation === "portrait" ? "Portrait" : "Landscape"}</td>
        <td>${s.images.length}</td>
        <td>${s.ticker.length}</td>
      </tr>`
    )
    .join("");

  const body = `
    <div class="card">
      <h1>Display Sites</h1>
      ${sites.length ? `<table><thead><tr><th>Name</th><th>Orientation</th><th>Images</th><th>Ticker lines</th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="muted">No display sites yet. Create one below.</p>`}
      <a class="btn" href="/sites/new">+ New site</a>
      <form class="inline" method="post" action="/build">
        <button class="secondary" type="submit">Rebuild</button>
      </form>
    </div>
  `;

  return layout({ title: "Sites", body, flash });
}

module.exports = { renderList };
