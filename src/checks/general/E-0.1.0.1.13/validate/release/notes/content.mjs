import validateReleaseNotesBody from "./content/body.mjs";
import validateReleaseNotesTitle from "./title.mjs";
export default function validateReleaseNotesContent(content, packageVersion) {
  const errors = validateReleaseNotesTitle(content);
  const normalized = content.replace(/^\uFEFF/u, "");
  errors.push(...validateReleaseNotesBody(normalized, packageVersion));
  return errors;
}
