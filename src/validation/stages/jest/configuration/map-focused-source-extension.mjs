export function mapFocusedSourceExtension(extension) {
  return extension === ".mts" || extension === ".cts" ? ".mjs" : extension;
}
