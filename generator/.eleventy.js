const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const SITES_DIR = path.join(__dirname, "..", "sites-data");

const SITE_DEFAULTS = {
  orientation: "landscape",
  rotateViaCss: false,
  carouselIntervalSec: 8,
  images: [],
  ticker: [],
  tickerDirection: "ltr",
  tickerSpeedSec: 30,
  tickerSizePercent: 80,
  qrTarget: "",
};

function loadSites() {
  if (!fs.existsSync(SITES_DIR)) return [];
  return fs
    .readdirSync(SITES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(SITES_DIR, f), "utf8"));
      if (!data.slug) {
        throw new Error(`Site file ${f} is missing a "slug" field`);
      }
      return { ...SITE_DEFAULTS, ...data };
    });
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("sites", loadSites);
  eleventyConfig.addGlobalData("buildTime", () => new Date().toISOString());

  eleventyConfig.addAsyncShortcode("qrDataUri", async (url) => {
    if (!url) return "";
    return QRCode.toDataURL(url, { margin: 1, width: 240 });
  });

  // CSS/JS shared by every display page
  eleventyConfig.addPassthroughCopy({ "generator/assets": "static" });
  // Per-site uploaded images: assets/<slug>/images/* -> dist/assets/<slug>/images/*
  eleventyConfig.addPassthroughCopy({ assets: "assets" });

  return {
    dir: {
      input: "generator/templates",
      output: "dist",
    },
  };
};
