const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const SITES_DIR = path.join(ROOT, "sites-data");
const ASSETS_DIR = path.join(ROOT, "assets");

const SITE_DEFAULTS = {
  orientation: "landscape",
  rotateViaCss: false,
  carouselIntervalSec: 8,
  images: [],
  ticker: [],
  tickerEnabled: true,
  tickerDirection: "ltr",
  tickerSpeedSec: 30,
  tickerSizePercent: 80,
  qrEnabled: true,
  qrTarget: "",
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function ensureDirs() {
  fs.mkdirSync(SITES_DIR, { recursive: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function siteFilePath(slug) {
  return path.join(SITES_DIR, `${slug}.json`);
}

function imagesDir(slug) {
  return path.join(ASSETS_DIR, slug, "images");
}

function assertValidSlug(slug) {
  if (!slug || !SLUG_RE.test(slug)) {
    throw new Error(
      "Slug must contain only lowercase letters, numbers and hyphens, and start with a letter or number."
    );
  }
}

function listSites() {
  ensureDirs();
  return fs
    .readdirSync(SITES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readSiteFile(path.join(SITES_DIR, f)))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function readSiteFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return { ...SITE_DEFAULTS, ...data };
}

function getSite(slug) {
  const filePath = siteFilePath(slug);
  if (!fs.existsSync(filePath)) return null;
  return readSiteFile(filePath);
}

function writeSite(site) {
  assertValidSlug(site.slug);
  ensureDirs();
  fs.mkdirSync(imagesDir(site.slug), { recursive: true });
  fs.writeFileSync(siteFilePath(site.slug), JSON.stringify(site, null, 2) + "\n", "utf8");
}

function createSite({
  slug,
  name,
  orientation,
  rotateViaCss,
  carouselIntervalSec,
  tickerEnabled,
  tickerDirection,
  tickerSpeedSec,
  tickerSizePercent,
  qrEnabled,
  qrTarget,
}) {
  assertValidSlug(slug);
  if (getSite(slug)) {
    throw new Error(`An entry named "${slug}" already exists.`);
  }
  const site = {
    ...SITE_DEFAULTS,
    slug,
    name: name || slug,
    orientation: orientation === "portrait" ? "portrait" : "landscape",
    rotateViaCss: !!rotateViaCss,
    carouselIntervalSec: Number(carouselIntervalSec) || SITE_DEFAULTS.carouselIntervalSec,
    tickerEnabled: !!tickerEnabled,
    tickerDirection: tickerDirection === "rtl" ? "rtl" : "ltr",
    tickerSpeedSec: clamp(tickerSpeedSec, 5, 120, SITE_DEFAULTS.tickerSpeedSec),
    tickerSizePercent: clamp(tickerSizePercent, 20, 150, SITE_DEFAULTS.tickerSizePercent),
    qrEnabled: !!qrEnabled,
    qrTarget: qrTarget || "",
  };
  writeSite(site);
  return site;
}

function updateSiteFields(slug, fields) {
  const site = getSite(slug);
  if (!site) throw new Error(`Unknown site "${slug}".`);
  const updated = {
    ...site,
    name: fields.name ?? site.name,
    orientation: fields.orientation === "portrait" ? "portrait" : "landscape",
    rotateViaCss: !!fields.rotateViaCss,
    carouselIntervalSec: Number(fields.carouselIntervalSec) || site.carouselIntervalSec,
    tickerEnabled: !!fields.tickerEnabled,
    tickerDirection: fields.tickerDirection === "rtl" ? "rtl" : "ltr",
    tickerSpeedSec: clamp(fields.tickerSpeedSec, 5, 120, site.tickerSpeedSec),
    tickerSizePercent: clamp(fields.tickerSizePercent, 20, 150, site.tickerSizePercent),
    qrEnabled: !!fields.qrEnabled,
    qrTarget: fields.qrTarget ?? site.qrTarget,
  };
  writeSite(updated);
  return updated;
}

function updateTicker(slug, lines) {
  const site = getSite(slug);
  if (!site) throw new Error(`Unknown site "${slug}".`);
  site.ticker = lines.map((l) => l.trim()).filter(Boolean);
  writeSite(site);
  return site;
}

function deleteSite(slug) {
  const site = getSite(slug);
  if (!site) return;
  fs.rmSync(siteFilePath(slug), { force: true });
  fs.rmSync(path.join(ASSETS_DIR, slug), { recursive: true, force: true });
}

function addImage(slug, filename) {
  return addImages(slug, [filename]);
}

function addImages(slug, filenames) {
  const site = getSite(slug);
  if (!site) throw new Error(`Unknown site "${slug}".`);
  for (const filename of filenames) {
    if (!site.images.includes(filename)) {
      site.images.push(filename);
    }
  }
  writeSite(site);
  return site;
}

function removeImage(slug, filename) {
  const site = getSite(slug);
  if (!site) throw new Error(`Unknown site "${slug}".`);
  site.images = site.images.filter((f) => f !== filename);
  writeSite(site);
  fs.rmSync(path.join(imagesDir(slug), filename), { force: true });
  return site;
}

function moveImage(slug, filename, direction) {
  const site = getSite(slug);
  if (!site) throw new Error(`Unknown site "${slug}".`);
  const idx = site.images.indexOf(filename);
  if (idx === -1) return site;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= site.images.length) return site;
  [site.images[idx], site.images[swapWith]] = [site.images[swapWith], site.images[idx]];
  writeSite(site);
  return site;
}

module.exports = {
  SITES_DIR,
  ASSETS_DIR,
  listSites,
  getSite,
  createSite,
  updateSiteFields,
  updateTicker,
  deleteSite,
  addImage,
  addImages,
  removeImage,
  moveImage,
  imagesDir,
  assertValidSlug,
};
