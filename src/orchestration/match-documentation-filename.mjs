export function matchesDocumentationFilename(predicate, name) {
  try {
    return predicate(name);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Documentation filename predicate failed for "${name}": ${reason}`, {
      cause: error,
    });
  }
}
