export async function readGeneratedDirectoryRecords(directory, readDirectory) {
  return (await readDirectory(directory)).flatMap((entry) => {
    const isDirectory = entry.isDirectory();
    if (!isDirectory && !entry.isFile()) return [];
    return [{ path: `${directory}/${entry.name}`, type: isDirectory ? "directory" : "file" }];
  });
}
