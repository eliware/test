export function createRepositoryAstSourceReader(read) {
  const sourceReads = new Map();

  return function readSource(key, absoluteFile, suppliedSource) {
    if (suppliedSource !== undefined) return Promise.resolve(suppliedSource);
    const pendingRead = sourceReads.get(key);
    if (pendingRead) return pendingRead;
    const currentRead = Promise.resolve().then(() => read(absoluteFile, "utf8"));
    sourceReads.set(key, currentRead);
    currentRead.then(
      () => sourceReads.delete(key),
      () => sourceReads.delete(key),
    );
    return currentRead;
  };
}
