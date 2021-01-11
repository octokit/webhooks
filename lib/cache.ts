import { promises as fs } from "fs";
import { dirname, resolve as resolvePath } from "path";

const CACHE_DIR = resolvePath(__dirname, "..", "cache");

const toCachePath = (path: string) => resolvePath(CACHE_DIR, `./${path}`);

export const cache = {
  async read(path: string): Promise<string> {
    return fs.readFile(toCachePath(path), "utf8");
  },
  async write(path: string, data: string): Promise<void> {
    const cachePath = toCachePath(path);

    await fs.mkdir(dirname(cachePath), { recursive: true });

    return fs.writeFile(cachePath, data);
  },
};
