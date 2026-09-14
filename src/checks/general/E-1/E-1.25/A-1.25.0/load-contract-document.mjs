import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function loadContractDocument(root) {
  try {
    const [contracts, index] = await Promise.all([
      readFile(join(root, "specs", "contracts.json"), "utf8").then(JSON.parse),
      readFile(join(root, "specs", "README.md"), "utf8"),
    ]);
    return { contracts, index, error: null };
  } catch {
    return {
      contracts: null,
      index: null,
      error: "specs/contracts.json and specs/README.md are required and must be readable.",
    };
  }
}
