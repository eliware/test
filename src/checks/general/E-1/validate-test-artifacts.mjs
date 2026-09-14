const artifactNames = /(?:^|[._-])(?:fixture|fixtures|snapshot|snapshots|generator|generators|test-support|test-utils)(?:[._-]|$)/iu;
const artifactDirectories = /(?:^|\/)(?:__snapshots__|fixtures?|fixture-data|snapshots?|generators?|generated|test-support|test-utils|support|helpers)(?:\/|$)/iu;
const artifactExtensions = /(?:\.snap|\.snapshot)$/iu;
const dataExtensions = /(?:\.json|\.ya?ml|\.csv|\.txt)$/iu;

export function findMisplacedArtifacts(sourceFiles, testFiles) {
  return [
    ...sourceFiles.map((file) => ({ file, test: false })),
    ...testFiles.map((file) => ({ file, test: true })),
  ]
    .map(({ file, test }) => ({ file: file.replaceAll("\\", "/"), test }))
    .filter(({ file, test }) => {
      if (file.startsWith("artifacts/")) return false;
      const name = file.split("/").at(-1);
      const isSourceLessTestHelper = test && name.endsWith(".mjs") && !name.endsWith(".test.mjs");
      const isArtifactPath = artifactDirectories.test(file);
      const isArtifactName = artifactNames.test(name);
      const isArtifactExtension = artifactExtensions.test(name);
      const isDataArtifact = dataExtensions.test(name) && (isArtifactPath || isArtifactName);
      return isSourceLessTestHelper || isArtifactPath || isArtifactName || isArtifactExtension || isDataArtifact;
    })
    .map(({ file }) => file);
}
