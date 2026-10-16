export function addShadowedJestDescribe(name, shadowed, names) {
  if (names.describes?.has(name)) shadowed.describes.add(name);
}
