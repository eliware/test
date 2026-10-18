const userFacingAttributes = new Set(["alt", "aria-label", "placeholder", "title"]);

export function isUserFacingAttribute(name) {
  return userFacingAttributes.has(name);
}
