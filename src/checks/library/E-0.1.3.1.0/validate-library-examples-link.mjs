import { join } from "node:path";
import { extractMarkdownLinks } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";
import { readRepositoryText } from "../../../validation/shared/repository/read-repository-text.mjs";

export async function validateLibraryExamplesLink(context = {}) {
  const readme = await readRepositoryText(
    context,
    join(context.root ?? process.cwd(), "README.md"),
  ).catch(() => "");
  const references = extractMarkdownLinks(readme).map(({ reference }) => reference);
  return references.some((reference) =>
    ["examples/README.md", "./examples/README.md"].includes(reference),
  )
    ? []
    : ["README.md must link examples/README.md."];
}
