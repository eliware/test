import validateReadmeSpecificationsLink from "./link.mjs";
export default async function validateReadmeSpecificationsIndex(readme, headings, readIndex) {
  const linkError = validateReadmeSpecificationsLink(readme, headings);
  if (linkError) return linkError;
  try {
    await readIndex();
    return null;
  } catch {
    return "README.md specs index link must resolve to specs/README.md.";
  }
}
