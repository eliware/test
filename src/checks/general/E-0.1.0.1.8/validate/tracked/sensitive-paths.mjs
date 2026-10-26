import { isSensitivePath } from "./is/sensitive-path.mjs";
import { readTrackedIndexEntries } from "./read-index-entries.mjs";

export async function validateTrackedSensitivePaths(root, runGit, isPathExempt = () => false) {
  try {
    const paths = (await readTrackedIndexEntries(root, runGit))
      .map(({ path }) => path)
      .filter((path) => !isPathExempt(path) && isSensitivePath(path));
    return paths.length ? [`Tracked sensitive paths are prohibited: ${paths.join(", ")}.`] : [];
  } catch {
    return ["Git index status could not be read. Sensitive paths are unknown."];
  }
}
