const artifactNames = /(?:^|[._-])(?:fixture|fixtures|snapshot|snapshots|generator|generators|test-support|test-utils)(?:[._-]|$)/iu;

export function findMisplacedArtifacts(sourceFiles, testFiles) {
  return [...sourceFiles, ...testFiles]
    .filter((file) => artifactNames.test(file.split("/").at(-1)) && !file.startsWith("artifacts/"));
}
