/** Resolve a package from the consumer first, then this bundled runtime. */
export function resolvePackage(name, consumerRequire, packageRequire) {
  try { return consumerRequire.resolve(name); }
  catch { return packageRequire.resolve(name); }
}
