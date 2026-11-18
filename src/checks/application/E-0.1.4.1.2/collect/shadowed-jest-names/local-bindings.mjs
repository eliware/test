export default function addShadowedJestName(name, shadowed, names, callbackNames) {
  if (names.callbacks.has(name) || names.namespaces.has(name)) shadowed.tests.add(name);
  if (callbackNames.has(name)) shadowed.callbacks.add(name);
  if (names.describes?.has(name)) shadowed.describes.add(name);
}
