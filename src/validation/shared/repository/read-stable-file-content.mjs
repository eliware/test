import { stat as statPath } from "node:fs/promises";

export function repositoryFileVersion(metadata) {
  return [metadata.dev, metadata.ino, metadata.size, metadata.mtimeNs, metadata.ctimeNs].join(":");
}

export async function readStableFileContent(path, read, stat = statPath) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const before = repositoryFileVersion(await stat(path, { bigint: true }));
    const content = await Promise.resolve(read(path)).then((value) =>
      Buffer.isBuffer(value) ? value : Buffer.from(value),
    );
    const after = repositoryFileVersion(await stat(path, { bigint: true }));
    if (before === after) return { content, version: after };
  }
  throw new Error(`File changed while reading repository content: ${path}.`);
}
