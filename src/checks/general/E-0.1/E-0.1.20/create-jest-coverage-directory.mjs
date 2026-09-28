import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function createJestCoverageDirectory({
  getTemporaryDirectory = tmpdir,
  ensureDirectory = mkdir,
  createTemporaryDirectory = mkdtemp,
} = {}) {
  const root = join(getTemporaryDirectory(), "eliware-test");
  try {
    await ensureDirectory(root, { recursive: true });
    return await createTemporaryDirectory(join(root, "coverage-"));
  } catch (error) {
    throw new Error(
      `Could not prepare Jest coverage output under the system temporary directory "${root}": ${messageOf(error)}`,
      { cause: error },
    );
  }
}
