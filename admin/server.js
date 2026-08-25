const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

const sites = require("./lib/sites");
const { runBuild, runPublish } = require("./lib/build");
const { basicAuth } = require("./lib/auth");
const { renderList } = require("./views/list");
const { renderNewSite } = require("./views/newSite");
const { renderEdit } = require("./views/edit");

const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || 4000;

const app = express();
app.use(basicAuth);
app.use(express.urlencoded({ extended: true }));
app.use("/site-images", express.static(sites.ASSETS_DIR));
app.use("/preview", express.static(path.join(ROOT, "dist")));

function flashFromQuery(req) {
  if (!req.query.msg) return null;
  return { message: req.query.msg, error: req.query.err === "1" };
}

function redirectWithFlash(res, url, message, isError) {
  const qs = new URLSearchParams({ msg: message, ...(isError ? { err: "1" } : {}) });
  res.redirect(`${url}?${qs.toString()}`);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        cb(null, sites.imagesDir(req.params.slug));
      } catch (err) {
        cb(err);
      }
    },
    filename: (_req, file, cb) => {
      // Folder uploads (webkitdirectory) can include a relative path in
      // originalname (e.g. "myfolder/photo.jpg") - strip it to a flat,
      // filesystem-safe name. The random suffix keeps rapid multi-file
      // uploads from colliding when Date.now() lands on the same millisecond.
      const baseName = file.originalname.split(/[/\\]/).pop();
      const safeName = baseName.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const unique = crypto.randomBytes(4).toString("hex");
      cb(null, `${Date.now()}-${unique}-${safeName}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 200 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  },
});

app.get("/", (req, res) => {
  res.send(renderList(sites.listSites(), flashFromQuery(req)));
});

app.get("/sites/new", (req, res) => {
  res.send(renderNewSite(flashFromQuery(req)));
});

app.post("/sites", (req, res) => {
  try {
    const site = sites.createSite(req.body);
    redirectWithFlash(res, `/sites/${site.slug}`, "Site created successfully.");
  } catch (err) {
    redirectWithFlash(res, "/sites/new", err.message, true);
  }
});

app.get("/sites/:slug", (req, res) => {
  const site = sites.getSite(req.params.slug);
  if (!site) return res.status(404).send("Site not found");
  res.send(renderEdit(site, flashFromQuery(req)));
});

app.post("/sites/:slug", (req, res) => {
  const { slug } = req.params;
  try {
    sites.updateSiteFields(slug, req.body);
    redirectWithFlash(res, `/sites/${slug}`, "Settings saved.");
  } catch (err) {
    redirectWithFlash(res, `/sites/${slug}`, err.message, true);
  }
});

app.post("/sites/:slug/ticker", (req, res) => {
  const { slug } = req.params;
  try {
    const lines = String(req.body.ticker || "").split(/\r?\n/);
    sites.updateTicker(slug, lines);
    redirectWithFlash(res, `/sites/${slug}`, "Ticker saved.");
  } catch (err) {
    redirectWithFlash(res, `/sites/${slug}`, err.message, true);
  }
});

app.post("/sites/:slug/images", upload.array("images", 200), (req, res) => {
  const { slug } = req.params;
  try {
    if (!req.files || !req.files.length) throw new Error("No images were selected.");
    sites.addImages(slug, req.files.map((f) => f.filename));
    const count = req.files.length;
    redirectWithFlash(res, `/sites/${slug}`, count === 1 ? "Image uploaded." : `${count} images uploaded.`);
  } catch (err) {
    redirectWithFlash(res, `/sites/${slug}`, err.message, true);
  }
});

app.post("/sites/:slug/images/:filename/delete", (req, res) => {
  const { slug, filename } = req.params;
  try {
    sites.removeImage(slug, filename);
    redirectWithFlash(res, `/sites/${slug}`, "Image deleted.");
  } catch (err) {
    redirectWithFlash(res, `/sites/${slug}`, err.message, true);
  }
});

app.post("/sites/:slug/images/:filename/move", (req, res) => {
  const { slug, filename } = req.params;
  try {
    sites.moveImage(slug, filename, req.body.direction === "up" ? "up" : "down");
    redirectWithFlash(res, `/sites/${slug}`, "Image order updated.");
  } catch (err) {
    redirectWithFlash(res, `/sites/${slug}`, err.message, true);
  }
});

app.post("/sites/:slug/delete", (req, res) => {
  const { slug } = req.params;
  sites.deleteSite(slug);
  redirectWithFlash(res, "/", "Site deleted.");
});

app.post("/build", async (req, res) => {
  const result = await runBuild();
  redirectWithFlash(res, "/", result.ok ? "Build completed successfully." : `Build error:\n${result.stderr}`, !result.ok);
});

app.post("/publish", async (req, res) => {
  const steps = await runPublish("Update TV display content");
  const failed = steps.find((s) => !s.ok && !/nothing to commit/i.test(s.stdout + s.stderr));
  const summary = steps.map((s) => `$ ${s.command}\n${s.stdout}\n${s.stderr}`.trim()).join("\n\n");
  redirectWithFlash(res, "/", failed ? `Publish ran into a problem:\n${summary}` : "Published successfully.", !!failed);
});

app.listen(PORT, () => {
  console.log(`TVStation admin running at http://localhost:${PORT}`);
});
