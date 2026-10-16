export function findLockfileDependencyEntry(packages, parent, name) {
  let current = parent;
  while (true) {
    const candidate = `${current}/node_modules/${name}`.replace(/^\//u, "");
    if (Object.hasOwn(packages, candidate)) return candidate;
    const nested = current.lastIndexOf("/node_modules/");
    if (nested < 0)
      return Object.hasOwn(packages, `node_modules/${name}`) ? `node_modules/${name}` : null;
    current = current.slice(0, nested);
  }
}
