export function validateReadmeMetadata(readme, packageJson = {}) {
  const author =
    typeof packageJson?.author === "string" ? packageJson.author : packageJson?.author?.name;
  const values = [packageJson?.description, author, packageJson?.license];
  if (values.some((value) => typeof value !== "string" || !value.trim()))
    return "package.json must define a description, author, and license.";
  const labels = ["description", "author", "license"];
  const missing = values.flatMap((value, index) => (readme.includes(value) ? [] : [labels[index]]));
  return missing.length ? `README.md must include exact package ${missing.join(", ")}.` : null;
}
