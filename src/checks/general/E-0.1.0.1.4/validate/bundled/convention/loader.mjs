import { listSpecificationEntries } from "../../../list-specification-entries.mjs";
import { parseBundledYamlDocuments } from "../../specification/parse-bundled-yaml-documents.mjs";
import { join } from "node:path";

export async function loadBundledConventionDocuments({ root, entries, read, readdir }) {
  const discoveredEntries = entries ?? (await listSpecificationEntries(root, { list: readdir }));
  const paths = discoveredEntries
    .filter(
      ({ path, type }) =>
        type === "file" &&
        /^specs\/conventions\/.*\.ya?ml$/iu.test(path) &&
        path !== "specs/conventions/ordering/profile-combinations.yaml",
    )
    .map(({ path }) => path);
  const documents = [];
  for (const path of paths) {
    const values = parseBundledYamlDocuments(await read(join(root, path), "utf8"), path);
    values.forEach((value, index) =>
      documents.push({ path: `${path} document ${index + 1}`, value }),
    );
  }
  return documents;
}
