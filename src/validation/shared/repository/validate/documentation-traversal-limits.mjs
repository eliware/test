export default function assertDocumentationFileLimit(fileCount, maxFiles) {
  if (fileCount > maxFiles)
    throw new Error(`Documentation traversal exceeded the ${maxFiles}-file limit.`);
}
