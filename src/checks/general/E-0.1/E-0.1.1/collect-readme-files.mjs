import { collectDocumentationFiles } from "../../../documentation/E-0.1.100/collect-documentation-files.mjs";

export function collectReadmeFiles(root, inventory) {
  return inventory
    ? inventory.documentationFiles({
        directory: root,
        predicate: (name) => name === "README.md",
      })
    : collectDocumentationFiles(root, root, (name) => name === "README.md");
}
