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
  exists(path: any) {
    return pathExists(toCachePath(path));
  },
  read(path: any) {
    return readFile(toCachePath(path), "utf8");
  },
  async write(path: any, data: any) {
    const cachePath = toCachePath(path);
    await ensureDir(dirname(cachePath));
    return writeFile(cachePath, data);
  },
  writeHtml(path: any, data: any) {
    return cache.write(path, data);
  },
  readJson(path: any) {
    return readJson(toCachePath(path));
  },
  writeJson(path: any, data: any) {
    return cache.write(path, JSON.stringify(data, null, 2) + "\n");
  },
};

function toCachePath(path: any) {
  return resolvePath(CACHE_DIR, `./${path}`);
}

export default cache;
