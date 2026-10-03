export function findNpmignoreFiles(files = []) {
  return files.filter((path) =>
    path
      .replaceAll("\\", "/")
      .split("/")
      .some((segment) => segment.toLowerCase() === ".npmignore"),
  );
}
