import { readApplicationReadmeSections } from "./read-application-readme-sections.mjs";

export function validateApplicationReadmeContent(readme) {
  const sections = readApplicationReadmeSections(readme);
  const configuration = sections.configuration ?? "";
  const operations = sections.operations ?? "";
  const noConfiguration = /no runtime configuration/iu.test(configuration);
  const documentsConfiguration =
    /runtime (?:configuration|settings)/iu.test(configuration) && /default/iu.test(configuration);
  const missing = [];
  if (!noConfiguration && !documentsConfiguration) missing.push("runtime settings and defaults");
  if (!/startup|start\w*/iu.test(operations)) missing.push("startup");
  if (!/shutdown/iu.test(operations)) missing.push("shutdown");
  if (!/workflows?/iu.test(operations)) missing.push("externally observable workflows");
  if (!/operational boundar|boundar/iu.test(operations)) missing.push("operational boundaries");
  return missing.length
    ? `Application README.md must document ${missing.join(", ")} in Configuration and Operations.`
    : null;
}
