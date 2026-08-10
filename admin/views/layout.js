function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout({ title, body, flash }) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} - ניהול תצוגות TVStation</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #f3f4f6; color: #111827; margin: 0; }
  header { background: #111827; color: #fff; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  header a { color: #fff; text-decoration: none; font-weight: 600; }
  main { max-width: 860px; margin: 1.5rem auto; padding: 0 1rem 3rem; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.1rem; margin-top: 0; }
  label { display: block; font-weight: 600; margin: 0.75rem 0 0.25rem; font-size: 0.9rem; }
  input[type=text], input[type=number], input[type=url], textarea, select {
    width: 100%; padding: 0.5rem 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.95rem; font-family: inherit;
  }
  textarea { min-height: 6rem; }
  .checkbox-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; }
  .checkbox-row input { width: auto; }
  button, .btn {
    display: inline-block; margin-top: 1rem; background: #2563eb; color: #fff; border: none;
    padding: 0.55rem 1.1rem; border-radius: 6px; font-size: 0.95rem; cursor: pointer; text-decoration: none;
  }
  button.secondary, .btn.secondary { background: #4b5563; }
  button.danger, .btn.danger { background: #dc2626; }
  form.inline { display: inline; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 0.5rem; text-align: right; border-bottom: 1px solid #e5e7eb; }
  .muted { color: #6b7280; font-size: 0.85rem; }
  .flash { background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 0.7rem 1rem; border-radius: 8px; margin-bottom: 1rem; white-space: pre-wrap; }
  .flash.error { background: #fef2f2; border-color: #dc2626; color: #991b1b; }
  .image-list { list-style: none; padding: 0; margin: 0.5rem 0; }
  .image-list li { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; border-bottom: 1px solid #f3f4f6; }
  .image-list img { width: 70px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; }
  .image-list .name { flex: 1; font-size: 0.85rem; }
  .row-actions button { margin: 0; padding: 0.25rem 0.5rem; font-size: 0.8rem; }
  pre.log { background: #111827; color: #d1fae5; padding: 0.75rem; border-radius: 6px; overflow-x: auto; font-size: 0.8rem; }
</style>
</head>
<body>
<header>
  <a href="/">TVStation - ניהול תצוגות</a>
</header>
<main>
  ${flash ? `<div class="flash${flash.error ? " error" : ""}">${escapeHtml(flash.message)}</div>` : ""}
  ${body}
</main>
</body>
</html>`;
}

module.exports = { layout, escapeHtml };
