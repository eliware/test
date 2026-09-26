export function hasDocumentedLatestAlias(readme) {
  const text = String(readme).toLowerCase();
  const describesAlias =
    /\blatest\b[\s\S]{0,160}\bmutable convenience alias\b/u.test(text) ||
    /\bmutable convenience alias\b[\s\S]{0,160}\blatest\b/u.test(text);
  const rejectsIdentity = ["release", "deployment"].every((identity) =>
    new RegExp(`\\b(?:never|not)\\b[\\s\\S]{0,100}\\b${identity}\\b`, "u").test(text),
  );
  return describesAlias && rejectsIdentity;
}
