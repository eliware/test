import { basename, isAbsolute, relative, sep } from "node:path";

export const smokeTempPrefix = ".eliware-tarball-smoke-";

export function isFreshSmokeTempChild(parent, path) {
  const relativePath = relative(parent, path);
  return (
    relativePath !== "" &&
    !relativePath.includes(sep) &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath) &&
    basename(path).startsWith(smokeTempPrefix)
  );
}
