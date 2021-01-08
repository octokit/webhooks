import { ensureDir, pathExists, readFile, readJson, writeFile } from "fs-extra";
import { dirname, resolve as resolvePath } from "path";

const CACHE_DIR = resolvePath(__dirname, "..", "cache");

const toCachePath = (path: string) => resolvePath(CACHE_DIR, `./${path}`);

export const cache = {
  async exists(path: string): Promise<boolean> {
    return pathExists(toCachePath(path));
  },
  async read(path: string): Promise<string> {
    return readFile(toCachePath(path), "utf8");
  },
  async write(path: string, data: string): Promise<void> {
    const cachePath = toCachePath(path);

    await ensureDir(dirname(cachePath));

    return writeFile(cachePath, data);
  },
  async writeHtml(path: string, data: string): Promise<void> {
    return cache.write(path, data);
  },
  readJson(path) {
    return readJson(toCachePath(path));
  },
  writeJson(path, data) {
    return cache.write(path, JSON.stringify(data, null, 2) + "\n");
  },
};
