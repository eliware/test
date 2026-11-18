import parseBoundedYamlDocuments from "../parse-bounded-yaml-documents.mjs";
function parseBoundedYamlValue(source, path) {
  const [document, ...remaining] = parseBoundedYamlDocuments(source, path);
  if (remaining.length) throw new Error(`${path} must contain one YAML document.`);
  if (!document) return null;
  const parseError = document?.errors[0];
  if (parseError) throw parseError;
  return document?.toJS({
    maxAliasCount: 100,
  });
}
export default parseBoundedYamlValue;
