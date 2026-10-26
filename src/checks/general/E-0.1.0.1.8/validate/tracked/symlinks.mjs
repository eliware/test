import { readTrackedIndexEntries } from "./read-index-entries.mjs";

export async function validateTrackedSymlinks(root, runGit, isPathExempt = () => false) {
  try {
    const links = (await readTrackedIndexEntries(root, runGit))
      .filter(({ mode }) => mode === "120000")
      .filter(({ path }) => !isPathExempt(path))
      .map(({ path }) => path);
    return links.length ? [`Tracked symlink entries are prohibited: ${links.join(", ")}.`] : [];
  } catch {
    return ["Git index status could not be read. Tracked symlinks are unknown."];
  }
}
