const {
  ensureDir,
  pathExists,
  readFile,
  readJson,
  writeFile,
} = require("fs-extra");
const { resolve: resolvePath, dirname } = require("path");

const CACHE_DIR = resolvePath(__dirname, "..", "cache");

const cache = {
  exists(path) {
    return pathExists(toCachePath(path));
  },
  read(path) {
    return readFile(toCachePath(path), "utf8");
  },
  async write(path, data) {
    const cachePath = toCachePath(path);
    await ensureDir(dirname(cachePath));
    return writeFile(cachePath, data);
  },
  writeHtml(path, data) {
    return cache.write(path, data);
  },
  readJson(path) {
    return readJson(toCachePath(path));
  },
  writeJson(path, data) {
    return cache.write(path, JSON.stringify(data, null, 2) + "\n");
  },
};

function toCachePath(path) {
  return resolvePath(CACHE_DIR, `./${path}`);
}

module.exports = cache;
