import { isAbsolute, relative, sep } from "node:path";
export default function containsOrMatches(parent, path) {
  const relativePath = relative(parent, path);
  return (
    relativePath === "" ||
    (relativePath !== ".." && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
}
