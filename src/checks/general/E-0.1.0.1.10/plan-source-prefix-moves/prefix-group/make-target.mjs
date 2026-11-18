function makeTarget(directory, prefix, entry) {
  const folder = prefix.slice(0, -1);
  const file = `${entry.stem.slice(prefix.length)}${entry.suffix}`;
  return [directory, folder, file].filter(Boolean).join("/");
}
export default makeTarget;
