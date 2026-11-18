const userFacingAttributes = new Set(["alt", "aria-label", "placeholder", "title"]);
export default function isUserFacingAttribute(name) {
  return userFacingAttributes.has(name);
}
