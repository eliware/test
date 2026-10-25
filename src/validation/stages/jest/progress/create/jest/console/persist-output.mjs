import { appendFileSync, writeFileSync } from "node:fs";

export function createJestOutputPersistence(
  path,
  { append = appendFileSync, replace = writeFileSync } = {},
) {
  let writeError = false;
  return {
    start() {
      if (!path) return true;
      try {
        replace(path, "", "utf8");
      } catch {
        writeError = true;
      }
      return !writeError;
    },
    append(text) {
      if (!path || writeError || !text) return !writeError;
      try {
        append(path, text, "utf8");
      } catch {
        writeError = true;
      }
      return !writeError;
    },
    finish(text) {
      if (path) {
        try {
          replace(path, text, "utf8");
        } catch {
          writeError = true;
        }
      }
      return !writeError;
    },
  };
}
