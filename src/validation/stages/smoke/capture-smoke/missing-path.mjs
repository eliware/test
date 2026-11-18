export default function preserveMissingSmokePath(error, path) {
  if (error.code !== "ENOENT") throw error;
  return {
    path,
    type: "missing",
  };
}
