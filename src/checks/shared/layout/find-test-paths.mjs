export default function findTestPaths(files) {
  return files.filter((path) => path.startsWith("tests/") && path.endsWith(".test.mjs"));
}
